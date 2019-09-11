export const debounce = (fun: (args: any) => any, time: number) => {
    let timeout: any | undefined = undefined;
    return (args: any) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            fun(args);
        }, time);
    }
}