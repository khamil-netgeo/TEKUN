<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1B2B5E; margin: 0; padding: 0; }
  .header { background: #1B2B5E; color: white; padding: 20px 40px; }
  .header h1 { margin: 0; font-size: 18px; }
  .header p { margin: 2px 0; font-size: 11px; }
  .content { padding: 30px 40px; }
  .ref-box { background: #fff5f5; border-left: 4px solid #C62828; padding: 10px 15px; margin-bottom: 20px; }
  h2 { color: #C62828; font-size: 14px; text-transform: uppercase; border-bottom: 2px solid #C62828; padding-bottom: 5px; }
  .reason-box { background: #fff5f5; border: 1px solid #C62828; padding: 12px 15px; margin: 15px 0; border-radius: 4px; }
  .signature { margin-top: 40px; }
  .signature-line { border-top: 1px solid #1B2B5E; width: 200px; margin-top: 50px; }
  .footer { background: #f3f4f6; padding: 10px 40px; font-size: 10px; color: #6b7280; text-align: center; margin-top: 30px; }
</style>
</head>
<body>
<div class="header">
  <h1>TEKUN NASIONAL</h1>
  <p>Tabung Ekonomi Kumpulan Usaha Niaga</p>
  <p>No. 45, Jalan Dungun, Damansara Heights, 50490 Kuala Lumpur</p>
</div>
<div class="content">
  <div class="ref-box">
    <p><strong>Rujukan:</strong> {{ $ref_no }}</p>
    <p><strong>Tarikh:</strong> {{ $today }}</p>
  </div>

  <p>Kepada,<br>
  <strong>{{ $app->applicant_name }}</strong><br>
  {{ $app->address ?? '' }}</p>

  <p>Tuan/Puan,</p>
  <h2>MAKLUMAN KEPUTUSAN PERMOHONAN PEMBIAYAAN</h2>

  <p>Merujuk kepada permohonan pembiayaan tuan/puan bertarikh yang telah kami terima, dengan segala hormatnya kami memaklumkan bahawa permohonan tersebut <strong>TIDAK DAPAT DILULUSKAN</strong> atas sebab-sebab berikut:</p>

  <div class="reason-box">
    <p><strong>Sebab Penolakan:</strong></p>
    <p>{{ $reason }}</p>
  </div>

  <p>Keputusan ini dibuat setelah penilaian menyeluruh dilakukan terhadap permohonan tuan/puan berdasarkan kriteria kelayakan dan polisi pembiayaan TEKUN Nasional yang berkuat kuasa.</p>

  <p>Tuan/puan boleh mengemukakan permohonan baharu setelah keadaan kewangan bertambah baik atau menghubungi cawangan TEKUN Nasional yang berdekatan untuk mendapatkan panduan lanjut.</p>

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