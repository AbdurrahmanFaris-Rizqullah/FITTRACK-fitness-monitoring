/**
 * Kalkulasi Body Fat % menggunakan metode US Navy
 * Sumber: Hodgdon & Beckett (1984), digunakan secara resmi oleh US Navy
 * Semua satuan dalam cm
 */

export type KelaminInput = "PRIA" | "WANITA";

export interface USNavyInput {
  kelamin: KelaminInput;
  tb: number;             // tinggi badan (cm)
  lingkar_leher: number;  // lingkar leher (cm)
  lingkar_pinggang: number; // lingkar perut/pinggang (cm)
  lingkar_pinggul?: number; // lingkar pinggul (cm) — wajib untuk wanita
}

export interface USNavyResult {
  body_fat: number; // persentase lemak tubuh (%)
  valid: boolean;
  error?: string;
}

/**
 * Hitung body fat % dengan metode US Navy
 * Rumus: Hodgdon & Beckett (1984)
 *
 * Pria:
 *   %BF = 495 / (1.0324 - 0.19077 × log10(pinggang - leher) + 0.15456 × log10(tinggi)) - 450
 *
 * Wanita:
 *   %BF = 495 / (1.29579 - 0.35004 × log10(pinggang + pinggul - leher) + 0.22100 × log10(tinggi)) - 450
 */
export function hitungUSNavy(input: USNavyInput): USNavyResult {
  const { kelamin, tb, lingkar_leher, lingkar_pinggang, lingkar_pinggul } = input;

  // Validasi nilai positif dan masuk akal
  if (tb <= 0 || lingkar_leher <= 0 || lingkar_pinggang <= 0) {
    return { body_fat: 0, valid: false, error: "Nilai tb, lingkar_leher, dan lingkar_pinggang harus lebih dari 0" };
  }

  if (kelamin === "WANITA") {
    if (!lingkar_pinggul || lingkar_pinggul <= 0) {
      return { body_fat: 0, valid: false, error: "lingkar_pinggul wajib diisi untuk wanita" };
    }

    const arg = lingkar_pinggang + lingkar_pinggul - lingkar_leher;
    if (arg <= 0) {
      return { body_fat: 0, valid: false, error: "Nilai (pinggang + pinggul - leher) harus lebih dari 0" };
    }

    const bodyFat =
      495 /
        (1.29579 -
          0.35004 * Math.log10(arg) +
          0.221 * Math.log10(tb)) -
      450;

    return { body_fat: parseFloat(bodyFat.toFixed(2)), valid: true };
  }

  // PRIA
  const arg = lingkar_pinggang - lingkar_leher;
  if (arg <= 0) {
    return { body_fat: 0, valid: false, error: "Nilai (pinggang - leher) harus lebih dari 0. Pastikan lingkar pinggang lebih besar dari lingkar leher." };
  }

  const bodyFat =
    495 /
      (1.0324 -
        0.19077 * Math.log10(arg) +
        0.15456 * Math.log10(tb)) -
    450;

  return { body_fat: parseFloat(bodyFat.toFixed(2)), valid: true };
}

/**
 * Kategorisasi body fat % berdasarkan standar American Council on Exercise (ACE)
 */
export function kategoriBodyFat(bodyFat: number, kelamin: KelaminInput): string {
  if (kelamin === "PRIA") {
    if (bodyFat < 6)   return "Esensial";
    if (bodyFat < 14)  return "Atlet";
    if (bodyFat < 18)  return "Kebugaran";
    if (bodyFat < 25)  return "Normal";
    return "Obesitas";
  }

  // WANITA
  if (bodyFat < 14)  return "Esensial";
  if (bodyFat < 21)  return "Atlet";
  if (bodyFat < 25)  return "Kebugaran";
  if (bodyFat < 32)  return "Normal";
  return "Obesitas";
}
