/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GOOGLE SHEETS SERVICE - Integração com Google Sheets API
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface AppendRowParams {
    accessToken: string;
    spreadsheetId: string;
    range: string; // Ex: 'Leads!A:F'
    values: (string | number | boolean)[];
}

interface AppendRowResult {
    success: boolean;
    updatedRange?: string;
    updatedRows?: number;
    error?: string;
}

/**
 * Adiciona uma linha no final da planilha
 */
export async function appendRowToSheet(
    params: AppendRowParams
): Promise<AppendRowResult> {
    const { accessToken, spreadsheetId, range, values } = params;

    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [values],
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Google Sheets] Erro:', errorData);
            return { success: false, error: errorData.error?.message || 'Erro ao adicionar linha' };
        }

        const data = await response.json();

        return {
            success: true,
            updatedRange: data.updates?.updatedRange,
            updatedRows: data.updates?.updatedRows,
        };
    } catch (error) {
        console.error('[Google Sheets] Exceção:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        };
    }
}

/**
 * Salva um lead na planilha configurada
 */
export async function saveLeadToSheet(
    accessToken: string,
    spreadsheetId: string,
    lead: {
        name: string;
        phone: string;
        email?: string;
        interest: string;
        source?: string;
        notes?: string;
    }
): Promise<AppendRowResult> {
    const values = [
        new Date().toISOString(), // Data/Hora
        lead.name,
        lead.phone,
        lead.email || '-',
        lead.interest,
        lead.source || 'WhatsApp',
        lead.notes || '',
    ];

    return appendRowToSheet({
        accessToken,
        spreadsheetId,
        range: 'Leads!A:G', // Ajustar conforme sua planilha
        values,
    });
}

/**
 * Lê dados de uma range específica
 */
export async function readSheetRange(
    accessToken: string,
    spreadsheetId: string,
    range: string
) {
    try {
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.error?.message };
        }

        const data = await response.json();
        return { success: true, values: data.values || [] };
    } catch (error) {
        console.error('[Google Sheets] Erro ao ler:', error);
        return { success: false, error: 'Erro ao ler planilha' };
    }
}

/**
 * Cria uma planilha de leads se não existir
 */
export async function ensureLeadsSheet(
    accessToken: string,
    spreadsheetId: string
) {
    // Verificar se a aba 'Leads' existe
    const existingData = await readSheetRange(accessToken, spreadsheetId, 'Leads!A1:G1');

    if (existingData.success && existingData.values?.length > 0) {
        return { success: true, exists: true };
    }

    // Adicionar cabeçalho se a aba estiver vazia
    const headers = [
        'Data/Hora',
        'Nome',
        'Telefone',
        'Email',
        'Interesse',
        'Origem',
        'Observações',
    ];

    return appendRowToSheet({
        accessToken,
        spreadsheetId,
        range: 'Leads!A:G',
        values: headers,
    });
}

export type { AppendRowParams, AppendRowResult };
