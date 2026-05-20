export class MealUtils {

  static parseQuantity(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    if (!value.includes('/')) return parseFloat(value);

    if (value.includes(' ')) {
      const [whole, frac] = value.split(' ');
      return parseFloat(whole) + this.parseFraction(frac);
    }

    return this.parseFraction(value);
  }

  private static parseFraction(f: string): number {
    const [a, b] = f.split('/');
    return parseFloat(a) / parseFloat(b);
  }
}