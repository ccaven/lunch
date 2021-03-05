def getUnique(iterable, key=lambda x: x):
    uniqueValues = set()
    for elem, ekey in ((e, key(e)) for e in iterable):
        if ekey not in uniqueValues:
            yield elem
            uniqueValues.add(ekey)

def main():
    iterable = [1, 2, 1, 2, 3, 3, 4, 4]
    uniques = list(getUnique(iterable))
    print(uniques)

if __name__ == "__main__":
    main()