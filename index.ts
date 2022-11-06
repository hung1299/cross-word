interface IWord {
    value: string,
    hint: string,
}

class Config {
    static HORIZONTAL = "horizontal"
    static VERTICAL = "vertical"

    static MATRIX_SIZE = 200
}

const CrossWordGenerator = ({
    words,
    maxWords = 10
}: {
    words: IWord[],
    maxWords?: number;
}) => {
    const shuffleWords: IWord[] = JSON.parse(JSON.stringify(words))
    shuffleArray(shuffleWords)
    const matrix = initMatrix(20);

    placeWord({word: shuffleWords[0].value, matrix, x: 10, y: 10, direction: Config.HORIZONTAL})

    let word = shuffleWords.pop();
    console.log(shuffleWords, word);
    console.log(matrix);
}

const shuffleArray = (array: any[]) => {
    let currentIndex = array.length;
    let randomIndex: number;

    while (currentIndex !== 0){
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
}

const initMatrix = (gridSize = 100) => {
    return Array(gridSize).fill(undefined).map(() => Array(gridSize));
}

const placeWord = ({
    word, matrix, x, y, direction
}: {
    word: string,
    matrix: string[][],
    x: number,
    y: number,
    direction: string,
}) => {
    const directions = {
        [Config.HORIZONTAL]: [0, 1],
        [Config.VERTICAL]: [1, 0]
    }

    for(let index = 0; index < word.length; index++){
        const row = x + index * directions[direction][0];
        const col = x + index * directions[direction][1];
        matrix[row][col] = word[index]
    }
}

CrossWordGenerator({
    words: [
        {
            value: 'test',
            hint: 'no hint'
        },
        {
            value: 'abc',
            hint: 'no hint'
        },
        {
            value: 'notfound',
            hint: 'no hint'
        }
    ]
})