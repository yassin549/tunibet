import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/export
 * Export user data (transactions, bets, or all) in CSV or PDF format
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'transactions', 'bets', 'all'
    const format = searchParams.get('format') || 'csv'; // 'csv', 'pdf'
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Date range required' },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // Include full end date

    let data: any = {};

    // Fetch transactions if needed
    if (type === 'transactions' || type === 'all') {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order('created_at', { ascending: false });

      data.transactions = transactions || [];
    }

    // Fetch bets if needed
    if (type === 'bets' || type === 'all') {
      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())
        .order('created_at', { ascending: false });

      data.bets = bets || [];
    }

    if (format === 'csv') {
      const csv = generateCSV(data, type);
      const filename = `tunibet-${type}-${from}-${to}.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (format === 'pdf') {
      // For PDF, we'll return a simple text-based format
      // In production, use a library like jsPDF or pdfkit
      const pdf = generatePDFText(data, type, user, from, to);
      const filename = `tunibet-${type}-${from}-${to}.pdf`;

      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV from data
 */
function generateCSV(data: any, type: string): string {
  let csv = '';

  if (data.transactions && (type === 'transactions' || type === 'all')) {
    csv += 'TRANSACTIONS\n';
    csv += 'ID,Type,Status,Amount,Currency,Crypto Currency,Crypto Amount,Fee,Created At,Completed At\n';
    
    data.transactions.forEach((t: any) => {
      csv += `"${t.id}","${t.type}","${t.status}",${t.amount},"${t.currency}","${t.crypto_currency || ''}",${t.crypto_amount || ''},${t.fee},"${t.created_at}","${t.completed_at || ''}"\n`;
    });

    csv += '\n\n';
  }

  if (data.bets && (type === 'bets' || type === 'all')) {
    csv += 'BETS\n';
    csv += 'ID,Round ID,Amount,Cashout At,Profit,Status,Account Type,Created At\n';
    
    data.bets.forEach((b: any) => {
      csv += `"${b.id}","${b.round_id || ''}",${b.amount},${b.cashout_at || ''},${b.profit},"${b.status}","${b.account_type}","${b.created_at}"\n`;
    });
  }

  return csv;
}

/**
 * Generate PDF-like text (simplified)
 * In production, use a proper PDF library
 */
function generatePDFText(data: any, type: string, user: any, from: string, to: string): string {
  let content = `TUNIBET - EXPORT DE DONNEES\n\n`;
  content += `Utilisateur: ${user.email}\n`;
  content += `Période: ${from} à ${to}\n`;
  content += `Type: ${type.toUpperCase()}\n`;
  content += `Date d'export: ${new Date().toLocaleString('fr-FR')}\n`;
  content += `\n${'='.repeat(80)}\n\n`;

  if (data.transactions && (type === 'transactions' || type === 'all')) {
    content += `TRANSACTIONS (${data.transactions.length})\n\n`;
    
    data.transactions.forEach((t: any, i: number) => {
      content += `${i + 1}. ${t.type.toUpperCase()} - ${t.status}\n`;
      content += `   Montant: ${t.amount} ${t.currency.toUpperCase()}\n`;
      if (t.crypto_currency) {
        content += `   Crypto: ${t.crypto_amount} ${t.crypto_currency.toUpperCase()}\n`;
      }
      content += `   Date: ${new Date(t.created_at).toLocaleString('fr-FR')}\n`;
      content += `\n`;
    });

    content += `\n${'-'.repeat(80)}\n\n`;
  }

  if (data.bets && (type === 'bets' || type === 'all')) {
    content += `PARIS (${data.bets.length})\n\n`;
    
    const totalWagered = data.bets.reduce((sum: number, b: any) => sum + b.amount, 0);
    const totalProfit = data.bets.reduce((sum: number, b: any) => sum + b.profit, 0);
    
    content += `Total misé: ${totalWagered.toFixed(2)} TND\n`;
    content += `Profit net: ${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)} TND\n\n`;

    data.bets.forEach((b: any, i: number) => {
      content += `${i + 1}. ${b.status.toUpperCase()} - ${b.account_type}\n`;
      content += `   Mise: ${b.amount} TND\n`;
      if (b.cashout_at) {
        content += `   Encaissé à: ${b.cashout_at}x\n`;
      }
      content += `   Profit: ${b.profit >= 0 ? '+' : ''}${b.profit} TND\n`;
      content += `   Date: ${new Date(b.created_at).toLocaleString('fr-FR')}\n`;
      content += `\n`;
    });
  }

  content += `\n${'='.repeat(80)}\n`;
  content += `Fin du rapport\n`;

  return content;
}
