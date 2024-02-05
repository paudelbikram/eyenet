export class MatrixOperationType{
    static DOT_PRODUCT = new MatrixOperationType("DOT_PRODUCT");
    static ELEMENT_WISE_ADDITION = new MatrixOperationType("ELEMENT_WISE_ADDITION");
    static ELEMENT_WISE_FUNCTION = new MatrixOperationType("ELEMENT_WISE_FUNCTION");
    static ELEMENT_WISE_SUBSTRACTION = new MatrixOperationType("ELEMENT_WISE_SUBSTRACTION");
    static ELEMENT_WISE_MULTIPLICATION = new MatrixOperationType("ELEMENT_WISE_MULTIPLICATION");
    static SCALAR_MULTIPLICATION = new MatrixOperationType("SCALAR_MULTIPLICATION");
    static SCALAR_SUBSTRACTION = new MatrixOperationType("SCALAR_SUBSTRACTION");
    static SCALAR_ADDITION = new MatrixOperationType("SCALAR_ADDITION");
    static TRANSPOSE = new MatrixOperationType("TRANSPOSE");

    constructor(name) {
        this.name = name
    }
}