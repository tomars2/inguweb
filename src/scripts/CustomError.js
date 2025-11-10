class CustomError extends Error {
    constructor(props) {
        super(props);
        this.name = 'CustomError';
    }
}