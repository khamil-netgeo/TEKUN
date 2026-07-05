<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1B2B5E; margin: 0; padding: 0; }
  .header { background: #1B2B5E; color: white; padding: 20px 40px; display: flex; align-items: center; }
  .header h1 { margin: 0; font-size: 18px; }
  .header p { margin: 2px 0; font-size: 11px; }
  .content { padding: 30px 40px; }
  .ref-box { background: #f0f4ff; border-left: 4px solid #1B2B5E; padding: 10px 15px; margin-bottom: 20px; }
  .ref-box p { margin: 3px 0; }
  h2 { color: #1B2B5E; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #2E7D32; padding-bottom: 5px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  table th { background: #1B2B5E; color: white; padding: 8px 12px; text-align: left; font-size: 11px; }
  table td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
  table tr:nth-child(even) td { background: #f9fafb; }
  .amount-highlight { font-size: 22px; font-weight: bold; color: #2E7D32; }
  .terms { background: #fff8e1; border: 1px solid #f59e0b; padding: 12px 15px; margin: 15px 0; border-radius: 4px; }
  .terms p { margin: 4px 0; font-size: 11px; }
  .signature { margin-top: 40px; }
  .signature-line { border-top: 1px solid #1B2B5E; width: 200px; margin-top: 50px; }
  .footer { background: #f3f4f6; padding: 10px 40px; font-size: 10px; color: #6b7280; text-align: center; margin-top: 30px; }
  .valid-badge { display: inline-block; background: #2E7D32; color: white; padding: 4px 12px; border-radius: 3px; font-size: 11px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>TEKUN NASIONAL</h1>
    <p>Tabung Ekonomi Kumpulan Usaha Niaga</p>
    <p>No. 45, Jalan Dungun, Damansara Heights, 50490 Kuala Lumpur</p>
    <p>Tel: 03-2096 6000 | www.tekun.gov.my</p>
  </div>
</div>
<div class="content">
  <div class="ref-box">
    <p><strong>Rujukan:</strong> {{ $ref_no }}</p>
    <p><strong>Tarikh:</strong> {{ $today }}</p>
    <p><span class="valid-badge">SAH SEHINGGA: {{ $valid_until }}</span></p>
  </div>

  <p>Kepada,<br>
  <strong>{{ $app->applicant_name }}</strong><br>
  {{ $app->address ?? 'Alamat tidak dinyatakan' }}<br>
  {{ $app->state ?? '' }}</p>

  <p>Tuan/Puan,</p>
  <h2>SURAT TAWARAN PEMBIAYAAN — {{ strtoupper($app->scheme ?? 'SKIM TEKUN') }}</h2>

  <p>Dengan segala hormatnya, TEKUN Nasional dengan sukacitanya memaklumkan bahawa permohonan pembiayaan tuan/puan telah <strong>DILULUSKAN</strong> tertakluk kepada terma dan syarat berikut:</p>

  <h2>Butiran Pembiayaan</h2>
  <table>
    <tr><th>Perkara</th><th>Butiran</th></tr>
    <tr><td>Nama Pemohon</td><td>{{ $app->applicant_name }}</td></tr>
    <tr><td>No. Kad Pengenalan</td><td>{{ $app->ic_no ?? '-' }}</td></tr>
    <tr><td>Skim Pembiayaan</td><td>{{ $app->scheme ?? '-' }}</td></tr>
    <tr><td>Jumlah Pembiayaan Diluluskan</td><td><span class="amount-highlight">RM {{ number_format($amount, 2) }}</span></td></tr>
    <tr><td>Kadar Keuntungan (Flat Rate)</td><td>{{ $rate }}% setahun</td></tr>
    <tr><td>Tempoh Pembiayaan</td><td>{{ $tenure }} bulan</td></tr>
    <tr><td>Ansuran Bulanan</td><td><strong>RM {{ number_format($monthly_payment, 2) }}</strong></td></tr>
    <tr><td>Tujuan Pembiayaan</td><td>{{ $app->purpose ?? '-' }}</td></tr>
    <tr><td>No. Rujukan</td><td>{{ $ref_no }}</td></tr>
  </table>

  <div class="terms">
    <p><strong>Terma dan Syarat Penerimaan:</strong></p>
    <p>1. Tawaran ini adalah sah sehingga <strong>{{ $valid_until }}</strong>. Selepas tarikh tersebut, tawaran ini terbatal secara automatik.</p>
    <p>2. Pemohon dikehendaki hadir ke cawangan TEKUN Nasional yang berdekatan bersama dokumen asal untuk proses pengesahan dan akad.</p>
    <p>3. Pembiayaan ini tertakluk kepada prinsip Syariah dan peraturan TEKUN Nasional yang berkuat kuasa.</p>
    <p>4. Sebarang maklumat palsu yang diberikan akan menyebabkan tawaran ini dibatalkan dan tindakan undang-undang boleh diambil.</p>
  </div>

  <p>Pihak kami berharap tawaran ini dapat membantu tuan/puan dalam mengembangkan perniagaan. Untuk sebarang pertanyaan, sila hubungi cawangan TEKUN Nasional yang terdekat atau talian 03-2096 6000.</p>

  <div class="signature">
    <p>Yang benar,</p>
    <div class="signature-line"></div>
    <p><strong>PENGURUS KREDIT</strong><br>
    TEKUN Nasional<br>
    Tarikh: {{ $today }}</p>
  </div>
</div>
<div class="footer">
  Dokumen ini dijana secara automatik oleh Sistem Pengurusan Pembiayaan TEKUN (SPPT) | Sulit &amp; Peribadi
</div>
</body>
</html>