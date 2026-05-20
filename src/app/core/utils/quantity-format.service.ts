import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class QuantityFormatService {

  format(value: number): string {
    if (value === 0) return '0';

    const whole = Math.floor(value);
    const decimal = value - whole;

    const fraction = this.decimalToFraction(decimal);

    if (whole === 0) {
      return fraction;
    }

    if (!fraction) {
      return `${whole}`;
    }

    return `${whole} ${fraction}`;
  }

  private decimalToFraction(decimal: number): string {
    const rounded = Math.round(decimal * 1000) / 1000;

    const map: Record<number, string> = {
      0.125: '1/8',
      0.25: '1/4',
      0.333: '1/3',
      0.5: '1/2',
      0.667: '2/3',
      0.75: '3/4',
    };

    const keys = Object.keys(map).map(Number);

    for (const k of keys) {
      if (Math.abs(rounded - k) < 0.01) {
        return map[k];
      }
    }

    return '';
  }
}