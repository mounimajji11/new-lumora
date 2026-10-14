"""
Lumora AI — Automated Unit Tests Module (Groq LPU Integration)
Tagline: Ask anything. Understand more.
Purpose: Verifies Groq configuration loading, system prompt constraints,
         missing key safety, and client updates with default model openai/gpt-oss-20b.

Usage:
    python -m unittest test_chatbot.py
"""

import unittest
from chatbot_engine import LumoraEngine, SYSTEM_INSTRUCTION, DEFAULT_GROQ_MODEL, get_response_style_instructions


class TestLumoraEngine(unittest.TestCase):
    """Unit test cases for the Lumora AI backend engine."""

    def setUp(self):
        """Set up test engine instance."""
        self.engine = LumoraEngine(api_key="gsk_dummy_test_key_12345")

    def test_response_style_instructions(self):
        """Verify get_response_style_instructions returns distinct configurations."""
        concise = get_response_style_instructions("Concise")
        balanced = get_response_style_instructions("Balanced")
        detailed = get_response_style_instructions("Detailed")

        self.assertEqual(concise["style"], "concise")
        self.assertEqual(concise["max_tokens"], 350)
        self.assertIn("CONCISE", concise["directive"])

        self.assertEqual(balanced["style"], "balanced")
        self.assertEqual(balanced["max_tokens"], 900)
        self.assertIn("BALANCED", balanced["directive"])

        self.assertEqual(detailed["style"], "detailed")
        self.assertEqual(detailed["max_tokens"], 2500)
        self.assertIn("DETAILED", detailed["directive"])

    def test_engine_initialization(self):
        """Verify engine initializes with expected attributes and default model."""
        self.assertIsNotNone(self.engine)
        self.assertEqual(self.engine.model_name, "openai/gpt-oss-20b")
        self.assertEqual(self.engine.api_key, "gsk_dummy_test_key_12345")

    def test_system_instruction_completeness(self):
        """Verify that system instruction contains essential safety, intent, and truthfulness rules."""
        self.assertIn("Lumora AI", SYSTEM_INSTRUCTION)
        self.assertIn("Understand the user's intent before answering", SYSTEM_INSTRUCTION)
        self.assertIn("Answer the exact request first", SYSTEM_INSTRUCTION)
        self.assertIn("Do not turn simple vocabulary requests into long sentences or essays", SYSTEM_INSTRUCTION)
        self.assertIn("RIGOROUS TRUTHFULNESS", SYSTEM_INSTRUCTION)
        self.assertIn("HUMILITY & ADMITTING UNCERTAINTY", SYSTEM_INSTRUCTION)
        self.assertIn("PROGRAMMING & MULTI-LANGUAGE EXCELLENCE", SYSTEM_INSTRUCTION)

    def test_system_instruction_task_formatting(self):
        """Verify that system instruction includes task-specific formatting rules."""
        self.assertIn("TASK-SPECIFIC RESPONSE FORMATTING", SYSTEM_INSTRUCTION)
        self.assertIn("Vocabulary", SYSTEM_INSTRUCTION)
        self.assertIn("Synonyms", SYSTEM_INSTRUCTION)
        self.assertIn("Antonyms", SYSTEM_INSTRUCTION)
        self.assertIn("Word meanings", SYSTEM_INSTRUCTION)
        self.assertIn("Aptitude and Reasoning", SYSTEM_INSTRUCTION)
        self.assertIn("Programming", SYSTEM_INSTRUCTION)
        self.assertIn("Summarization", SYSTEM_INSTRUCTION)
        self.assertIn("General Questions", SYSTEM_INSTRUCTION)

    def test_missing_api_key_graceful_handling(self):
        """Verify that unconfigured engine returns an informative error rather than crashing."""
        unconfigured_engine = LumoraEngine(api_key="")
        result = unconfigured_engine.generate_response("What is artificial intelligence?")
        self.assertEqual(result["error"], "MISSING_API_KEY")
        self.assertIn("Groq API Key Required", result["text"])

    def test_api_key_update_method(self):
        """Verify that set_api_key method updates active credentials."""
        engine = LumoraEngine(api_key="")
        self.assertFalse(engine.is_configured())
        engine.set_api_key("gsk_valid_fake_key_abc123")
        self.assertTrue(engine.is_configured())

    def test_deprecated_model_auto_migration(self):
        """Verify that deprecated model IDs (e.g. llama-3.3-70b-versatile, llama-3.1-8b-instant) automatically migrate to openai/gpt-oss-20b."""
        engine_v = LumoraEngine(api_key="gsk_fake", model_name="llama-3.3-70b-versatile")
        self.assertEqual(engine_v.model_name, "openai/gpt-oss-20b")

        engine_i = LumoraEngine(api_key="gsk_fake", model_name="llama-3.1-8b-instant")
        self.assertEqual(engine_i.model_name, "openai/gpt-oss-20b")

    def test_six_required_quality_prompts(self):
        """
        Verify the 6 test prompts requested by user:
        1. Give me 5 synonyms for happy.
        2. Give me 5 antonyms for difficult.
        3. What is the meaning of perseverance?
        4. Find the next number: 2, 4, 8, 16, ?
        5. Write a Python program to check whether a number is prime.
        6. Explain this in simple English: Artificial intelligence.
        """
        import os
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key.strip() in ("", "your_groq_api_key_here"):
            self.skipTest("GROQ_API_KEY not configured in environment")

        engine = LumoraEngine(api_key=api_key)

        import time
        def call_with_retry(prompt, retries=3):
            for i in range(retries):
                res = engine.generate_response(prompt)
                if res.get("error") == "RATE_LIMIT_EXCEEDED":
                    time.sleep(2.0 + i)
                    continue
                return res
            return engine.generate_response(prompt)

        # 1. Synonyms: direct list
        res1 = call_with_retry("Give me 5 synonyms for happy.")
        if res1.get("error") in ("AUTH_ERROR", "INVALID_API_KEY"):
            self.skipTest("GROQ_API_KEY in environment is invalid or expired")
        self.assertIsNone(res1.get("error"))
        text1 = res1.get("text", "").lower()
        self.assertTrue(any(w in text1 for w in ["joyful", "cheerful", "glad", "delighted", "content", "pleased"]))

        time.sleep(1.0)
        # 2. Antonyms: direct list
        res2 = call_with_retry("Give me 5 antonyms for difficult.")
        self.assertIsNone(res2.get("error"))
        text2 = res2.get("text", "").lower()
        self.assertTrue(any(w in text2 for w in ["easy", "simple", "effortless", "straightforward", "manageable"]))

        time.sleep(1.0)
        # 3. Meaning: definition and example
        res3 = call_with_retry("What is the meaning of perseverance?")
        self.assertIsNone(res3.get("error"))
        text3 = res3.get("text", "").lower()
        self.assertTrue("effort" in text3 or "determination" in text3 or "persist" in text3 or "difficult" in text3)

        time.sleep(1.0)
        # 4. Aptitude: correct answer first (32)
        res4 = call_with_retry("Find the next number: 2, 4, 8, 16, ?")
        self.assertIsNone(res4.get("error"))
        text4 = res4.get("text", "").strip()
        self.assertTrue("32" in text4)

        time.sleep(1.0)
        # 5. Programming: working python code
        res5 = call_with_retry("Write a Python program to check whether a number is prime.")
        self.assertIsNone(res5.get("error"))
        text5 = res5.get("text", "")
        self.assertTrue("def " in text5 or "is_prime" in text5)

        time.sleep(1.0)
        # 6. Simple English explanation
        res6 = call_with_retry("Explain this in simple English: Artificial intelligence.")
        self.assertIsNone(res6.get("error"))
        text6 = res6.get("text", "").lower()
        self.assertTrue("computer" in text6 or "machine" in text6 or "intelligence" in text6 or "learn" in text6)


if __name__ == "__main__":
    unittest.main()
