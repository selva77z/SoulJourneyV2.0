try:
    import ephem
    import matplotlib
    import numpy
    print("Dependencies found")
except ImportError as e:
    print(f"Missing dependency: {e}")
