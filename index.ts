interface IPosition {
    row: number;
    col: number;
}

interface IWord {
    value: string;
    hint: string;
    position?: IPosition[];
    index?: number;
    direction?: string;
    timeTry?: number;
}

class Config {
    static HORIZONTAL = "horizontal";
    static VERTICAL = "vertical";

    static LIST_DIRECTIONS = [this.HORIZONTAL, this.VERTICAL];
    static DIRECTION_INDEXES = {
        [this.HORIZONTAL]: [0, 1],
        [this.VERTICAL]: [1, 0],
    };
}

const CrossWordGenerator = ({
    words,
    maxWord = 100,
}: {
    words: IWord[];
    maxWord?: number;
}) => {
    let shuffleWords: IWord[] = JSON.parse(JSON.stringify(words));
    shuffleArray(shuffleWords);
    let count = 1;
    let perfectGridSize = calculatePerfectGridSize(shuffleWords);
    if (perfectGridSize < 10) {
        perfectGridSize = 10;
    }
    let matrix = initMatrix(perfectGridSize);

    let word = shuffleWords.pop();
    shuffleWords = shuffleWords.map((w) => ({
        ...w,
        timeTry: shuffleWords.length,
    }));
    let direction =
        Config.LIST_DIRECTIONS[
            Math.floor(Math.random() * Config.LIST_DIRECTIONS.length)
        ];
    word = {
        ...word,
        position: placeWord({
            word: word.value,
            matrix,
            x: perfectGridSize / 2 - 1,
            y: perfectGridSize / 2 - 1,
            direction,
        }),
        index: count,
        direction,
    };
    replaceWord(words, word);

    while (maxWord > count && shuffleWords.length > 0) {
        let shouldBreak = false;
        let placements = [];
        word = shuffleWords.pop();
        for (
            let letterIndex = 0;
            letterIndex < word.value.length;
            letterIndex++
        ) {
            for (let x = 0; x < perfectGridSize; x++) {
                for (let y = 0; y < perfectGridSize; y++) {
                    const letter = matrix[x][y];

                    if (letter !== "." && word.value[letterIndex] === letter) {
                        const { result, placement } = canPlaceWord({
                            word,
                            words: words.filter((w) =>
                                w.hasOwnProperty("direction")
                            ),
                            matrix,
                            x,
                            y,
                        });
                        if (result) {
                            placements.push(placement);
                        }
                    }
                }
            }
        }

        let bestScore = 0;
        let bestBoard = [];
        placements.forEach((placement) => {
            const tempBoard = JSON.parse(JSON.stringify(matrix));
            const tempPosition = placeWord({
                word: word.value,
                matrix: tempBoard,
                x: placement.x,
                y: placement.y,
                direction: placement.direction,
            });
            const newScore = generateScore(tempBoard);

            if (newScore > bestScore && newScore < 20) {
                bestBoard = JSON.parse(JSON.stringify(tempBoard));
                bestScore = newScore;
                word = {
                    ...word,
                    position: tempPosition,
                    direction: placement.direction,
                };
            }
        });

        if (bestScore > 0) {
            console.log(bestScore);
            matrix = JSON.parse(JSON.stringify(bestBoard));
            count += 1;
            word = {
                ...word,
                index: count,
            };
            replaceWord(words, word);
            shouldBreak = true;
        }

        if (!shouldBreak && word.timeTry > 0) {
            console.log(`try word: ${word.value} - ${word.timeTry - 1} times`);
            word = {
                ...word,
                timeTry: word.timeTry - 1,
            };
            shuffleWords.unshift(word);
        }
    }

    let maxIndex = 0;
    words.forEach((w) => {
        if (w.index > maxIndex) maxIndex = w.index;
    });
    const { cropMatrix, minRow, maxRow, minCol, maxCol } =
        cropSizeOfMatrixWord(matrix);

    console.log(`Words count: ${words.length}, maxIndex: ${maxIndex}`);
    console.table(cropMatrix);
};

const cropSizeOfMatrixWord = (matrix: string[][]) => {
    const gridSize = matrix.length;
    let minRow = gridSize,
        minCol = gridSize;
    let maxRow = 0,
        maxCol = 0;

    matrix.forEach((row, rowIndex) => {
        row.forEach((letter, colIndex) => {
            if (letter !== ".") {
                if (rowIndex < minRow) minRow = rowIndex;
                if (rowIndex > maxRow) maxRow = rowIndex;
                if (colIndex < minCol) minCol = colIndex;
                if (colIndex > maxCol) maxCol = colIndex;
            }
        });
    });

    return {
        cropMatrix: matrix
            .slice(minRow, maxRow + 1)
            .map((col) => col.slice(minCol, maxCol + 1)),
        minRow,
        maxRow,
        minCol,
        maxCol,
    };
};

const generateScore = (matrix: string[][]) => {
    const { cropMatrix, minRow, maxRow, minCol, maxCol } =
        cropSizeOfMatrixWord(matrix);
    const rowCropMatrix = cropMatrix.length;
    const colCropMatrix = cropMatrix[0].length;
    let filled = 0,
        empty = 0;
    let sizeRatio = rowCropMatrix / colCropMatrix;
    if (rowCropMatrix > colCropMatrix) {
        sizeRatio = colCropMatrix / rowCropMatrix;
    }

    cropMatrix.forEach((row, rowIndex) => {
        row.forEach((letter, colIndex) => {
            if (!letter || letter === ".") {
                empty += 1;
            } else {
                filled += 1;
            }
        });
    });

    if (empty === 0) empty = 1;
    if (filled === 0) filled = 1;
    let filledRatio = filled / empty;

    return sizeRatio * 10 + filledRatio * 2;
};

const shuffleArray = (array: any[]) => {
    let currentIndex = array.length;
    let randomIndex: number;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex],
            array[currentIndex],
        ];
    }
};

const initMatrix = (gridSize = 100) => {
    return Array(gridSize)
        .fill(".")
        .map(() => Array(gridSize).fill("."));
};

const calculatePerfectGridSize = (words: IWord[]) => {
    const lengthWords = words.map((w: IWord) => w.value.length);
    lengthWords.sort((a, b) => b - a);

    const maxSize = Math.ceil(lengthWords.length / 2);
    let perfectSize = 0;
    for (let i = 0; i < maxSize; i++) {
        perfectSize += lengthWords[i];
    }

    return (perfectSize - maxSize + 1) * 2;
};

const replaceWord = (words: IWord[], word: IWord) => {
    const index = words.findIndex((w) => w.value === word.value);

    if (index >= 0) {
        delete word.timeTry;
        words[index] = word;
    }
};

const placeWord = ({
    word,
    matrix,
    x,
    y,
    direction,
}: {
    word: string;
    matrix: string[][];
    x: number;
    y: number;
    direction: string;
}) => {
    const position = [];
    const directions_index = Config.DIRECTION_INDEXES[direction];

    for (let index = 0; index < word.length; index++) {
        const row = x + index * directions_index[0];
        const col = y + index * directions_index[1];
        position.push({
            row,
            col,
        });
        matrix[row][col] = word[index];
    }

    return position;
};

const canPlaceWord = ({
    word,
    words,
    matrix,
    x,
    y,
}: {
    word: IWord;
    words: IWord[];
    matrix: string[][];
    x: number;
    y: number;
}) => {
    let direction,
        result = true,
        newX = -1,
        newY = -1;
    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
        let shouldBreak = false;
        for (
            let positionIndex = 0;
            positionIndex < words[wordIndex].position.length;
            positionIndex++
        ) {
            const currentPosition = words[wordIndex].position[positionIndex];
            if (currentPosition.row == x && currentPosition.col == y) {
                direction = words[wordIndex].direction;
                shouldBreak = true;
                break;
            }
        }
        if (shouldBreak) break;
    }

    if (direction) {
        direction =
            direction === Config.HORIZONTAL
                ? Config.VERTICAL
                : Config.HORIZONTAL;
        const directionsIndex = Config.DIRECTION_INDEXES[direction];
        const letterIndex = word.value.indexOf(matrix[x][y]);

        if (letterIndex >= 0) {
            for (let index = 0; index < word.value.length; index++) {
                const row = x + (index - letterIndex) * directionsIndex[0];
                const col = y + (index - letterIndex) * directionsIndex[1];

                if (index === 0) {
                    newX = row;
                    newY = col;
                }

                if (
                    matrix[row][col] !== "." &&
                    matrix[row][col] !== word.value[index]
                ) {
                    result = false;
                    break;
                }
            }

            return {
                result,
                placement: {
                    x: newX,
                    y: newY,
                    direction,
                },
            };
        }
    }

    return {
        result: false,
        placement: {},
    };
};

CrossWordGenerator({
    words: [
        {
            value: "hat",
            hint: "no hint",
        },
        {
            value: "notfound",
            hint: "no hint",
        },
        {
            value: "chicken",
            hint: "no hint",
        },
        {
            value: "monkey",
            hint: "no hint",
        },
        {
            value: "cat",
            hint: "no hint",
        },
        {
            value: "boundary",
            hint: "no hint",
        },
        {
            value: "available",
            hint: "no hint",
        },
        {
            value: "strive",
            hint: "no hint",
        },
        {
            value: "loutish",
            hint: "no hint",
        },
        {
            value: "meaty",
            hint: "no hint",
        },
        {
            value: "test",
            hint: "no hint",
        },
        {
            value: "user",
            hint: "no hint",
        },
        {
            value: "lion",
            hint: "no hint",
        },
    ],
});