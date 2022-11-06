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
    maxWord = 10,
}: {
    words: IWord[];
    maxWord?: number;
}) => {
    const shuffleWords: IWord[] = JSON.parse(JSON.stringify(words));
    shuffleArray(shuffleWords);
    console.log(shuffleWords);
    let count = 1;
    let perfectGridSize = calculatePerfectGridSize(shuffleWords);
    if (perfectGridSize < 10) {
        perfectGridSize = 10;
    }
    const matrix = initMatrix(perfectGridSize);

    let word = shuffleWords.pop();
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
        console.log(shuffleWords);
        word = shuffleWords.pop();
        for (let x = 0; x < perfectGridSize; x++) {
            for (let y = 0; y < perfectGridSize; y++) {
                const letter = matrix[x][y];
                if (letter !== "." && word.value.indexOf(letter) >= 0) {
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
                        console.log(result, placement);
                        count += 1;
                        word = {
                            ...word,
                            position: placeWord({
                                word: word.value,
                                matrix,
                                x: placement.x,
                                y: placement.y,
                                direction: placement.direction,
                            }),
                            index: count,
                            direction: placement.direction,
                        };
                        replaceWord(words, word);
                        shouldBreak = true;
                        break;
                    }
                }
            }
            if (shouldBreak) break;
        }
    }

    console.table(matrix);
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
    let direction;
    let result = true;
    let newX = -1;
    let newY = -1;
    words.every((w) => {
        w.position.every((p) => {
            if (p.col === x && p.row === y) {
                direction = w.direction;
                return false;
            }
            return true;
        });
        if (direction) return false;

        return true;
    });

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
            value: "test",
            hint: "no hint",
        },
        {
            value: "hat",
            hint: "no hint",
        },
        // {
        //     value: "notfound",
        //     hint: "no hint",
        // },
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
    ],
});
