export default class StringHelper {

    public static capitalizeFirstLetter(string: string) {
        return String(string).charAt(0).toUpperCase() + String(string).slice(1);
    };

}