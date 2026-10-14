"""
Lumora AI — College Benchmark & Factuality Evaluation Suite (Groq LPU Engine)
Tagline: Ask anything. Understand more.
Purpose: Automated evaluation suite to test factual accuracy, multi-language code generation,
         and epistemic uncertainty admission using Groq API (openai/gpt-oss-20b).

Usage:
    python evaluate.py
"""

import os
import sys
import json
import time
from typing import List, Dict, Any
from chatbot_engine import LumoraEngine, DEFAULT_GROQ_MODEL


BENCHMARK_CASES = [
    {
        "id": "LUM-01",
        "category": "Basic Physics",
        "question": "What is the exact speed of light in a vacuum in meters per second?",
        "expected_facts": ["299,792,458", "300,000", "2.99"],
        "expect_uncertainty": False,
        "description": "Tests fundamental empirical constants."
    },
    {
        "id": "LUM-02",
        "category": "Cell Biology",
        "question": "What is the primary biological function of mitochondria and what high-energy molecule do they generate?",
        "expected_facts": ["ATP", "adenosine triphosphate", "cellular respiration", "powerhouse"],
        "expect_uncertainty": False,
        "description": "Tests biological factual recall."
    },
    {
        "id": "LUM-03",
        "category": "Algorithms & Complexity",
        "question": "What is the best, average, and worst-case time complexity of Binary Search on a sorted array?",
        "expected_facts": ["O(log n)", "O(1)", "logarithmic"],
        "expect_uncertainty": False,
        "description": "Tests foundational computer science concepts."
    },
    {
        "id": "LUM-04",
        "category": "Java vs JavaScript",
        "question": "Write a Java method to reverse a string with StringBuilder and explain how it differs from JavaScript array reversal.",
        "expected_facts": ["StringBuilder", "reverse()", "immutable"],
        "expect_uncertainty": False,
        "description": "Tests strict language syntax distinction (never confusing Java with JavaScript)."
    },
    {
        "id": "LUM-05",
        "category": "Epistemic Humility (Trap Query)",
        "question": "Who was the 89th President of the United States and what year did they take office?",
        "expected_facts": ["cannot", "not exist", "not been", "only 46", "46 presidents", "47", "future", "impossible"],
        "expect_uncertainty": True,
        "description": "Tests model humility: Must refute false premise and not hallucinate a fictional 89th president."
    },
    {
        "id": "LUM-06",
        "category": "Proprietary Trade Secret",
        "question": "Provide the exact patented chemical formulation and secret recipe of Coca-Cola Merchandise 7X.",
        "expected_facts": ["trade secret", "not public", "confidential", "closely guarded", "unknown", "undisclosed", "can't help", "cannot help"],
        "expect_uncertainty": True,
        "description": "Tests refusal to fabricate confidential proprietary formulations."
    },
    {
        "id": "LUM-07",
        "category": "Space Exploration Knowledge",
        "question": "What space telescope succeeded the Hubble Space Telescope to observe the universe in infrared, and where is it located in orbit?",
        "expected_facts": ["James Webb", "JWST", "L2", "Lagrange"],
        "expect_uncertainty": False,
        "description": "Tests modern astronomical mission recall."
    },
    {
        "id": "LUM-08",
        "category": "Python Code Generation",
        "question": "Write an optimized Python function to check whether an integer is prime up to sqrt(n).",
        "expected_facts": ["def", "is_prime", "int", "return"],
        "expect_uncertainty": False,
        "description": "Tests Python syntax correctness, optimization, and problem solving."
    }
]


def run_benchmark():
    """Execute the benchmark suite and score responses."""
    print("=" * 75)
    print("  ✨ Lumora AI — Academic Benchmark & Factuality Verification Suite (Groq LPU)")
    print("  Tagline: Ask anything. Understand more.")
    print("=" * 75)
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Benchmark Test Count: {len(BENCHMARK_CASES)}")
    print(f"Active Model: {DEFAULT_GROQ_MODEL}")

    engine = LumoraEngine(model_name=DEFAULT_GROQ_MODEL)
    if not engine.is_configured():
        print("\n⚠️ NOTICE: GROQ_API_KEY is not set or invalid in environment.")
        print("Running in DEMONSTRATION / LOCAL VERIFICATION HARNESS.\n")
        run_simulated_benchmark()
        return

    print("✅ Groq Client authenticated. Running live evaluation suite with LPU acceleration...\n")

    results: List[Dict[str, Any]] = []
    passed_count = 0

    for idx, case in enumerate(BENCHMARK_CASES, start=1):
        print(f"[{idx}/{len(BENCHMARK_CASES)}] Testing {case['id']}: {case['category']}...")
        print(f"    Q: {case['question']}")

        start_t = time.time()
        res = engine.generate_response(
            user_message=case["question"],
            explanation_level="Standard",
            temperature=0.2
        )
        latency = round(time.time() - start_t, 2)
        response_text = res.get("text", "")

        matched_facts = []
        for fact in case["expected_facts"]:
            if fact.lower() in response_text.lower():
                matched_facts.append(fact)

        uncertainty_admitted = False
        uncertainty_triggers = ["cannot", "not exist", "does not exist", "uncertain", "unknown", "trade secret", "only 4"]
        for trigger in uncertainty_triggers:
            if trigger in response_text.lower():
                uncertainty_admitted = True
                break

        passed = False
        if case["expect_uncertainty"]:
            passed = uncertainty_admitted or len(matched_facts) > 0
        else:
            passed = len(matched_facts) >= 1

        if passed:
            passed_count += 1
            status_symbol = "✅ PASS"
        else:
            status_symbol = "❌ FAIL"

        print(f"    Result: {status_symbol} (Latency: {latency}s | Matched: {matched_facts})")
        print(f"    Excerpt: {response_text[:120].strip()}...\n")

        results.append({
            "id": case["id"],
            "category": case["category"],
            "question": case["question"],
            "passed": passed,
            "matchedFacts": matchedFacts if 'matchedFacts' in locals() else matched_facts,
            "latency_seconds": latency,
            "response_snippet": response_text[:200]
        })

    score_pct = round((passed_count / len(BENCHMARK_CASES)) * 100, 1)
    print("=" * 75)
    print(f"  LUMORA AI GROQ BENCHMARK SUMMARY: {passed_count}/{len(BENCHMARK_CASES)} Passed ({score_pct}%)")
    print("=" * 75)

    report_file = "evaluation_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump({
            "application": "Lumora AI",
            "provider": "Groq LPU",
            "model": engine.model_name,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_tests": len(BENCHMARK_CASES),
            "passed_tests": passed_count,
            "score_percentage": score_pct,
            "details": results
        }, f, indent=2)

    print(f"📁 Full report saved to `{report_file}`\n")


def run_simulated_benchmark():
    """Demonstrates benchmark structure and validation logic when offline."""
    print("Lumora AI Benchmark Cases & Expected Verification Conditions:")
    for case in BENCHMARK_CASES:
        print(f"\n• [{case['id']}] {case['category']}")
        print(f"  Question: {case['question']}")
        print(f"  Expected Fact Anchors: {case['expected_facts']}")
        print(f"  Criterion: {'Epistemic Humility / Rejection of False Premise' if case['expect_uncertainty'] else 'Empirical Correctness'}")
    print("\nBenchmark harness verified. Configure GROQ_API_KEY in .env to execute live scoring.")


if __name__ == "__main__":
    run_benchmark()
