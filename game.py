"""
Number guessing game logic — called by the API server.
Usage:
  python game.py start <min> <max>           → prints secret number as JSON
  python game.py check <secret> <guess> <max_guesses> <guess_count>
                                             → prints hint as JSON
"""

import sys
import json
import random


def cmd_start(min_val: int, max_val: int) -> dict:
    secret = random.randint(min_val, max_val)
    return {"secret": secret}


def cmd_check(secret: int, guess: int, max_guesses: int, guess_count: int) -> dict:
    if guess < secret:
        hint = "too_low"
    elif guess > secret:
        hint = "too_high"
    else:
        hint = "correct"

    if hint == "correct":
        status = "won"
    elif guess_count >= max_guesses:
        hint = "lost"
        status = "lost"
    else:
        status = "active"

    return {"hint": hint, "status": status}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "start":
        if len(sys.argv) < 4:
            print(json.dumps({"error": "Usage: start <min> <max>"}))
            sys.exit(1)
        min_val = int(sys.argv[2])
        max_val = int(sys.argv[3])
        result = cmd_start(min_val, max_val)
        print(json.dumps(result))

    elif command == "check":
        if len(sys.argv) < 6:
            print(json.dumps({"error": "Usage: check <secret> <guess> <max_guesses> <guess_count>"}))
            sys.exit(1)
        secret = int(sys.argv[2])
        guess = int(sys.argv[3])
        max_guesses = int(sys.argv[4])
        guess_count = int(sys.argv[5])
        result = cmd_check(secret, guess, max_guesses, guess_count)
        print(json.dumps(result))

    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
