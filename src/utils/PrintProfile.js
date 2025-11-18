import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export async function generateChildProfilePDF(profile) {
    const html = `
      <html>
        <body style="padding: 24px; font-family: Arial;">
          <h1>Perfil de ${profile.name}</h1>
          <p><strong>Edad:</strong> ${profile.age}</p>
          <p><strong>Peso:</strong> ${profile.weight}</p>
          <p><strong>Condiciones médicas:</strong> ${profile.conditions.join(", ")}</p>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    return uri;
}
