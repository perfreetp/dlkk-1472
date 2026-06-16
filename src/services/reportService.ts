import jsPDF from 'jspdf';
import type { Declaration, Enterprise, License, Premises, PrecheckResult } from '@/types';
import { businessTypeNames } from '@/store/declarationStore';



interface ReportData {
  declaration: Declaration;
  enterprise: Enterprise;
  license: License;
  premises: Premises;
  precheckResult: PrecheckResult | null;
  selfCheckScore: number;
}

const getScoreLevel = (score: number): { text: string; color: string } => {
  if (score >= 80) return { text: '合格', color: '#059669' };
  if (score >= 60) return { text: '待完善', color: '#D97706' };
  return { text: '不合格', color: '#DC2626' };
};

const getConclusion = (result: PrecheckResult | null, score: number): string => {
  if (!result) return '未执行预审';
  const missing = result.missingItems.length;
  const doubts = result.doubtItems.length;
  if (missing === 0 && doubts === 0 && score >= 80) {
    return '预审通过，可正式提交';
  }
  if (score >= 60) {
    return '有条件通过，建议补正后提交';
  }
  return '预审不通过，请补正材料后重新预审';
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

const getReportHTML = (data: ReportData): string => {
  const { declaration, enterprise, license, premises, precheckResult, selfCheckScore } = data;
  const scoreLevel = getScoreLevel(selfCheckScore);
  const conclusion = getConclusion(precheckResult, selfCheckScore);
  const reportDate = formatDate(new Date());
  const businessTypeText = businessTypeNames[declaration.businessType];

  const missingItems = precheckResult?.missingItems || [];
  const doubtItems = precheckResult?.doubtItems || [];
  const suggestionItems = precheckResult?.suggestions || [];

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>危险化学品经营许可证换证预审报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Microsoft YaHei", "SimSun", sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 80px;
      color: rgba(30, 58, 138, 0.08);
      font-weight: bold;
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }
    .report-container {
      position: relative;
      z-index: 1;
      max-width: 900px;
      margin: 0 auto;
    }
    .report-header {
      text-align: center;
      border-bottom: 3px double #1E3A8A;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .report-title {
      font-size: 26px;
      font-weight: bold;
      color: #1E3A8A;
      margin-bottom: 10px;
      font-family: "SimSun", serif;
      letter-spacing: 2px;
    }
    .report-subtitle {
      font-size: 14px;
      color: #666;
    }
    .report-meta {
      margin-top: 15px;
      font-size: 13px;
      color: #555;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1E3A8A;
      border-left: 4px solid #1E3A8A;
      padding-left: 10px;
      margin-bottom: 12px;
      font-family: "SimSun", serif;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 20px;
    }
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px dashed #e5e7eb;
    }
    .info-row-full {
      grid-column: 1 / -1;
    }
    .info-label {
      width: 120px;
      flex-shrink: 0;
      color: #555;
      font-weight: 500;
    }
    .info-value {
      flex: 1;
      color: #111;
      word-break: break-all;
    }
    .score-box {
      text-align: center;
      padding: 25px;
      background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .score-number {
      font-size: 56px;
      font-weight: bold;
      font-family: "Arial", sans-serif;
      color: ${scoreLevel.color};
      line-height: 1;
    }
    .score-label {
      font-size: 16px;
      color: #333;
      margin-top: 8px;
    }
    .score-badge {
      display: inline-block;
      padding: 4px 12px;
      background: ${scoreLevel.color};
      color: white;
      border-radius: 20px;
      font-size: 14px;
      margin-top: 8px;
      font-weight: 500;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      text-align: center;
      padding: 15px;
      border-radius: 6px;
    }
    .stat-card.danger { background: #FEF2F2; border: 1px solid #FECACA; }
    .stat-card.warning { background: #FFFBEB; border: 1px solid #FDE68A; }
    .stat-card.info { background: #EFF6FF; border: 1px solid #BFDBFE; }
    .stat-number {
      font-size: 28px;
      font-weight: bold;
      font-family: "Arial", sans-serif;
    }
    .stat-card.danger .stat-number { color: #DC2626; }
    .stat-card.warning .stat-number { color: #D97706; }
    .stat-card.info .stat-number { color: #0284C7; }
    .stat-label {
      font-size: 13px;
      color: #555;
      margin-top: 4px;
    }
    .conclusion-box {
      padding: 18px;
      background: #F8FAFC;
      border-left: 4px solid #1E3A8A;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .conclusion-label {
      font-size: 14px;
      color: #1E3A8A;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .conclusion-text {
      font-size: 15px;
      color: #111;
    }
    .item-list {
      list-style: none;
    }
    .item {
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 3px solid;
      background: #FAFAFA;
    }
    .item.danger { border-left-color: #DC2626; background: #FEF2F2; }
    .item.warning { border-left-color: #D97706; background: #FFFBEB; }
    .item.info { border-left-color: #0284C7; background: #EFF6FF; }
    .item-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 6px;
      color: #111;
    }
    .item-desc {
      font-size: 13px;
      color: #555;
      margin-bottom: 6px;
      white-space: pre-wrap;
    }
    .item-suggestion {
      font-size: 13px;
      color: #1E3A8A;
      padding: 6px 10px;
      background: rgba(30, 58, 138, 0.08);
      border-radius: 4px;
    }
    .item-suggestion::before {
      content: "💡 建议：";
      font-weight: bold;
    }
    .empty-state {
      text-align: center;
      padding: 20px;
      color: #9CA3AF;
      font-size: 13px;
    }
    .report-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9CA3AF;
    }
    .footer-signature {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      padding: 0 40px;
    }
    .signature-col {
      text-align: center;
    }
    .signature-line {
      width: 180px;
      border-bottom: 1px solid #333;
      margin-bottom: 6px;
      height: 40px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="watermark">预审专用</div>
  <div class="report-container">
    <div class="report-header">
      <div class="report-title">危险化学品经营许可证换证预审报告</div>
      <div class="report-subtitle">Pre-review Report for Hazardous Chemicals Business License Renewal</div>
      <div class="report-meta">
        报告编号：${declaration.id}　｜　预审日期：${reportDate}
      </div>
    </div>

    <div class="section">
      <div class="section-title">一、企业基本信息</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">企业名称</span>
          <span class="info-value">${enterprise.name || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">统一社会信用代码</span>
          <span class="info-value">${enterprise.creditCode || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">法定代表人</span>
          <span class="info-value">${enterprise.legalPerson || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">经营方式</span>
          <span class="info-value">${businessTypeText}</span>
        </div>
        <div class="info-row info-row-full">
          <span class="info-label">注册地址</span>
          <span class="info-value">${enterprise.registeredAddress || '—'}</span>
        </div>
        <div class="info-row info-row-full">
          <span class="info-label">经营地址</span>
          <span class="info-value">${premises.businessAddress || enterprise.businessAddress || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">联系人</span>
          <span class="info-value">${enterprise.contactPerson || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">联系电话</span>
          <span class="info-value">${enterprise.contactPhone || '—'}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">二、原许可证信息</div>
      <div class="info-grid">
        <div class="info-row">
          <span class="info-label">许可证号</span>
          <span class="info-value">${license.licenseNumber || '—'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">有效期至</span>
          <span class="info-value">${license.validTo || '—'}</span>
        </div>
        <div class="info-row info-row-full">
          <span class="info-label">许可范围</span>
          <span class="info-value">${license.scope || '—'}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">三、预审评分</div>
      <div class="score-box">
        <div class="score-number">${selfCheckScore}</div>
        <div class="score-label">自查打分（满分 100 分）</div>
        <div class="score-badge">${scoreLevel.text}</div>
      </div>
      <div class="stats-row">
        <div class="stat-card danger">
          <div class="stat-number">${missingItems.length}</div>
          <div class="stat-label">缺失项</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-number">${doubtItems.length}</div>
          <div class="stat-label">疑点项</div>
        </div>
        <div class="stat-card info">
          <div class="stat-number">${suggestionItems.length}</div>
          <div class="stat-label">建议项</div>
        </div>
      </div>
      <div class="conclusion-box">
        <div class="conclusion-label">预审结论</div>
        <div class="conclusion-text">${conclusion}</div>
      </div>
    </div>

    ${missingItems.length > 0 ? `
    <div class="section">
      <div class="section-title">四、缺失项清单</div>
      <ul class="item-list">
        ${missingItems.map((item, i) => `
        <li class="item danger">
          <div class="item-title">${i + 1}. ${item.title}</div>
          <div class="item-desc">${item.description}</div>
          <div class="item-suggestion">${item.suggestion}</div>
        </li>
        `).join('')}
      </ul>
    </div>
    ` : `
    <div class="section">
      <div class="section-title">四、缺失项清单</div>
      <div class="empty-state">✓ 无缺失项，必填材料齐全</div>
    </div>
    `}

    ${doubtItems.length > 0 ? `
    <div class="section">
      <div class="section-title">五、疑点说明</div>
      <ul class="item-list">
        ${doubtItems.map((item, i) => `
        <li class="item warning">
          <div class="item-title">${i + 1}. ${item.title}</div>
          <div class="item-desc">${item.description}</div>
          <div class="item-suggestion">${item.suggestion}</div>
        </li>
        `).join('')}
      </ul>
    </div>
    ` : `
    <div class="section">
      <div class="section-title">五、疑点说明</div>
      <div class="empty-state">✓ 无疑点项，信息填报一致</div>
    </div>
    `}

    ${suggestionItems.length > 0 ? `
    <div class="section">
      <div class="section-title">六、修改建议</div>
      <ul class="item-list">
        ${suggestionItems.map((item, i) => `
        <li class="item info">
          <div class="item-title">${i + 1}. ${item.title}</div>
          <div class="item-desc">${item.description}</div>
          <div class="item-suggestion">${item.suggestion}</div>
        </li>
        `).join('')}
      </ul>
    </div>
    ` : `
    <div class="section">
      <div class="section-title">六、修改建议</div>
      <div class="empty-state">✓ 无修改建议，材料符合要求</div>
    </div>
    `}

    <div class="report-footer">
      <div class="footer-signature">
        <div class="signature-col">
          <div class="signature-line"></div>
          <div>企业经办人签字</div>
        </div>
        <div class="signature-col">
          <div class="signature-line"></div>
          <div>预审员签字</div>
        </div>
      </div>
      <div style="margin-top: 30px;">
        本报告为预审参考，不替代正式审批。正式办理请以窗口受理结果为准。<br/>
        报告生成时间：${new Date().toLocaleString('zh-CN')}
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

export async function generatePDF(data: ReportData): Promise<void> {
  const html = getReportHTML(data);
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  if (!printWindow) {
    alert('请允许弹出窗口以生成报告');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  await new Promise(resolve => setTimeout(resolve, 500));

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text('危险化学品经营许可证换证预审报告', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report No.: ${data.declaration.id}  |  Date: ${formatDate(new Date())}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  doc.setLineWidth(0.5);
  doc.setDrawColor(30, 58, 138);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  const addSectionTitle = (title: string) => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138);
    doc.text(title, margin, yPos);
    yPos += 8;
  };

  const addInfoRow = (label: string, value: string) => {
    if (yPos > pageHeight - 20) {
      doc.addPage();
      yPos = margin;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${label}:`, margin, yPos);
    doc.setTextColor(0);
    doc.text(value || '-', margin + 45, yPos);
    yPos += 7;
  };

  addSectionTitle('1. Enterprise Information');
  addInfoRow('Enterprise Name', data.enterprise.name);
  addInfoRow('Credit Code', data.enterprise.creditCode);
  addInfoRow('Legal Person', data.enterprise.legalPerson);
  addInfoRow('Business Type', businessTypeNames[data.declaration.businessType]);
  addInfoRow('Address', data.premises.businessAddress || data.enterprise.businessAddress);
  addInfoRow('Contact', data.enterprise.contactPerson);
  addInfoRow('Phone', data.enterprise.contactPhone);
  yPos += 4;

  addSectionTitle('2. License Information');
  addInfoRow('License No.', data.license.licenseNumber);
  addInfoRow('Valid Until', data.license.validTo);
  addInfoRow('Scope', data.license.scope);
  yPos += 4;

  addSectionTitle('3. Precheck Score');
  const scoreLevel = getScoreLevel(data.selfCheckScore);
  doc.setFontSize(36);
  doc.setTextColor(scoreLevel.color === '#059669' ? 5 : scoreLevel.color === '#D97706' ? 217 : 220,
    scoreLevel.color === '#059669' ? 150 : scoreLevel.color === '#D97706' ? 119 : 38,
    scoreLevel.color === '#059669' ? 105 : scoreLevel.color === '#D97706' ? 6 : 38);
  doc.text(String(data.selfCheckScore), pageWidth / 2, yPos + 15, { align: 'center' });
  yPos += 25;

  doc.setFontSize(11);
  doc.setTextColor(51);
  doc.text(`Self-Check Score (Out of 100) - ${scoreLevel.text}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  const missingCount = data.precheckResult?.missingItems.length || 0;
  const doubtCount = data.precheckResult?.doubtItems.length || 0;
  const suggestionCount = data.precheckResult?.suggestions.length || 0;
  const colWidth = (pageWidth - 2 * margin) / 3;

  const drawStatBox = (x: number, count: number, label: string, color: [number, number, number]) => {
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x, yPos, colWidth - 4, 28, 2, 2, 'F');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(count), x + colWidth / 2 - 2, yPos + 18, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + colWidth / 2 - 2, yPos + 25, { align: 'center' });
  };

  drawStatBox(margin, missingCount, 'Missing Items', [220, 38, 38]);
  drawStatBox(margin + colWidth, doubtCount, 'Doubt Items', [217, 119, 6]);
  drawStatBox(margin + colWidth * 2, suggestionCount, 'Suggestions', [2, 132, 199]);
  yPos += 38;

  addSectionTitle('4. Conclusion');
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos - 5, pageWidth - 2 * margin, 16, 2, 2, 'F');
  doc.setTextColor(0);
  doc.setFontSize(11);
  const conclusion = getConclusion(data.precheckResult, data.selfCheckScore);
  doc.text(`Conclusion: ${conclusion}`, margin + 5, yPos + 5);
  yPos += 22;

  const addItemList = (title: string, items: any[], color: [number, number, number]) => {
    addSectionTitle(title);
    if (items.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('No items. All requirements satisfied.', margin, yPos);
      yPos += 8;
      return;
    }
    items.forEach((item, index) => {
      if (yPos > pageHeight - 35) {
        doc.addPage();
        yPos = margin;
      }
      doc.setFillColor(color[0] + 50, color[1] + 50, color[2] + 50);
      doc.roundedRect(margin, yPos - 4, pageWidth - 2 * margin, 20, 2, 2, 'F');
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(1.5);
      doc.line(margin, yPos - 4, margin, yPos + 16);
      doc.setLineWidth(0.2);
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${item.title}`, margin + 4, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
      const descLines = doc.splitTextToSize(item.description, pageWidth - 2 * margin - 10);
      let tempY = yPos + 6;
      descLines.forEach((line: string) => {
        if (tempY > pageHeight - 10) {
          doc.addPage();
          tempY = margin;
        }
        doc.text(line, margin + 4, tempY);
        tempY += 5;
      });
      yPos = tempY + 2;
      const suggLines = doc.splitTextToSize(`Suggestion: ${item.suggestion}`, pageWidth - 2 * margin - 10);
      suggLines.forEach((line: string) => {
        if (yPos > pageHeight - 10) {
          doc.addPage();
          yPos = margin;
        }
        doc.setTextColor(30, 58, 138);
        doc.text(line, margin + 4, yPos);
        yPos += 5;
      });
      yPos += 6;
    });
  };

  addItemList('5. Missing Items', data.precheckResult?.missingItems || [], [220, 38, 38]);
  addItemList('6. Doubt Items', data.precheckResult?.doubtItems || [], [217, 119, 6]);
  addItemList('7. Suggestions', data.precheckResult?.suggestions || [], [2, 132, 199]);

  doc.setFontSize(9);
  doc.setTextColor(150);
  const footerY = pageHeight - 15;
  doc.text(`Generated on ${new Date().toLocaleString('zh-CN')}`, pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Page ${(doc as any).internal.pages.length}`, pageWidth - margin, footerY, { align: 'right' });

  doc.save(`预审报告_${data.enterprise.name || '企业'}_${new Date().toISOString().split('T')[0]}.pdf`);

  printWindow.close();
}

export async function printReport(data: ReportData): Promise<void> {
  const html = getReportHTML(data);
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  if (!printWindow) {
    alert('请允许弹出窗口以打印报告');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  await new Promise(resolve => setTimeout(resolve, 800));

  printWindow.focus();
  printWindow.print();
}

export function previewReport(data: ReportData): void {
  const html = getReportHTML(data);
  const printWindow = window.open('', '_blank', 'width=900,height=700');

  if (!printWindow) {
    alert('请允许弹出窗口以预览报告');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
}
