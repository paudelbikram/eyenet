
export class Matrix{

    /**
     * Generates matrix objects with provided size and populates 
     * it with all zeros(0)
     * @param {int} rows 
     * @param {int} cols 
     */
    constructor(rows, cols){
        this.rows = parseInt(rows);
        this.cols = parseInt(cols);
        this.data = [];

        for (let i = 0; i < this.rows; i++) {
            this.data[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] = 0;
            }
        }
    }


    /**
     * Creates a Matrix object out of 1 dimensional array. 
     * Here, the number of columns is always 1.
     * @param {Array} arr 
     * @returns {Matrix}
     */
    static fromArray(arr){
        let m = new Matrix(arr.length, 1);
        for (let i = 0; i < arr.length; i++) {
            m.data[i][0] = arr[i];
        }
        return m;
    }

    
    /**
     * Substracts Matrix b from Matrix a and return a new Matrix
     * @throws {Error} if Matrix a and b are not of same size
     * @param {Matrix} a 
     * @param {Matrix} b 
     * @returns {Matrix} a - b
     */
    static subtract(a, b){
        if (a.rows !== b.rows || a.cols !== b.cols){
            console.error("Can not substract matrices of different size");
            throw new Error("Can not substract matrices of different size")
        }
        let result = new Matrix(a.rows, a.cols);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
            result.data[i][j] = a.data[i][j] - b.data[i][j];
            }
        }
        return result;
    }
    

    /**
     * Appends all the rows together and creates a
     * 1 dimensional array
     * @returns {Array}
     */
    toArray(){
        let arr = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
            arr.push(this.data[i][j]);
            }
        }
        return arr;
    }


    /**
     * Populates matrix with random number between +1 and -1.
     */
    randomize(){
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
            this.data[i][j] = Math.random() * 2 - 1;
            }
        }
    }


    /**
     * Add to the matrix depending upon the parameter passed in.
     * In case of Matrix, does the matrix addition
     * In case of Scalar, adds scalar to all the elements of the Matrix
     * @param {Matrix|double} n 
     * @throws {error} if Matrix of difference size is passed in
     */
    add(n){
        if (n instanceof Matrix) {
            if (n.rows !== this.rows || n.cols !== this.cols){
                console.error("Can not add matrices of different size");
                throw new Error("Can not add matrices of different size")
            }
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.data[i][j] += n.data[i][j];
                }
            }
        } else {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.data[i][j] += n;
                }
            }
        }
    }


    /**
     * Returns a tranpose of Matrix
     * @param {Matrix} matrix 
     * @returns {Matrix}
     */
    static transpose(matrix) {
        let result = new Matrix(matrix.cols, matrix.rows);
        for (let i = 0; i < matrix.rows; i++) {
            for (let j = 0; j < matrix.cols; j++) {
            result.data[j][i] = matrix.data[i][j];
            }
        }
        return result;
    }


    /**
     * Generates dot product
     * @param {Matrix} a 
     * @param {Matrix} b 
     * @returns {Matrix}
     */
    static dotProduct(a, b) {
        if (a.cols !== b.rows) {
            console.error("Size does not match up for dot product");
            throw new Error("Size does not match up for dot product")
        }
        let result = new Matrix(a.rows, b.cols);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
            let sum = 0;
            for (let k = 0; k < a.cols; k++) {
                sum += a.data[i][k] * b.data[k][j];
            }
            result.data[i][j] = sum;
            }
        }
        return result;
    }


    /**
     * Does multiplication based on parameter that is passed in
     * In case of Matrix, does element wise multiplication
     * In case of scalar, multiple all element with scalar value
     * @param {Matrix|double} n 
     * @throws {error} if Matrix of different size is passed in
     */
    multiply(n) {
        if (n instanceof Matrix) {
            if (n.rows !== this.rows || n.cols !== this.cols){
                console.error("Can not multiply matrices of different size");
                throw new Error("Can not multiply matrices of different size")
            }
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.data[i][j] *= n.data[i][j];
                }
            }
        } else {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.data[i][j] *= n;
                }
            }
        }
    }


    /**
     * Applies function that is passed in to every element of matrix
     * @param {Function} func 
     */
    map(func) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                let val = this.data[i][j];
                this.data[i][j] = func(val);
            }
        }
    }
    
    /**
     * Takes Matrix and function and run function 
     * against every element in that matrix.
     * This does not mutate the passed matrix rather 
     * creates new matrix
     * @param {Matrix} matrix 
     * @param {Function} func 
     * @returns 
     */
    static map(matrix, func) {
        let result = new Matrix(matrix.rows, matrix.cols);
        for (let i = 0; i < matrix.rows; i++) {
            for (let j = 0; j < matrix.cols; j++) {
                let val = matrix.data[i][j];
                result.data[i][j] = func(val);
            }
        }
        return result;
    }

    deepCopy(){
        let result = new Matrix(this.rows, this.cols);
        for(let i = 0; i < this.rows; i++){
            for(let j = 0; j < this.cols; j++){
                result.data[i][j] = this.data[i][j];
            }
        }
        return result;
    }
    
    /**
     * Prints matix in table
     */
    print() {
        console.table(this.data);
    }
    
}