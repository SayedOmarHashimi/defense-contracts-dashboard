"""Run the full pipeline: extract from USASpending.gov, then build exports."""

import extract
import transform

if __name__ == "__main__":
    extract.main()
    transform.main()
