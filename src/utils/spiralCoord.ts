export const spiralCoord = (n: number) => {
    let k = Math.ceil((Math.sqrt(n) - 1) / 2)
    let t = 2 * k + 1
    let m = t ^ 2
    t = t - 1
    if (n >= m - t) {
        return [k - (m - n), -k]
    } else { m = m - t }
    if (n >= m - t) {
        return [-k, -k + (m - n)]
    } else { m = m - t }
    if (n >= m - t) {
        return [-k + (m - n), k]
    } else {
        return [k, k - (m - n - t)]
    }
}