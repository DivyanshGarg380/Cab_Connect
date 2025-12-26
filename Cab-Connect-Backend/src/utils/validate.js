export const isNonEmptyString = ( value ) => {
    return typeof value === 'string' && value.trim().length > 0;
};

export const isValidDate = (value) => {
    const d = new Date(value);
    return !isNaN(d.getTime());
}