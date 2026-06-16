import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Declaration, Enterprise, License, Premises, PrecheckResult, ReportOperationType } from '@/types';
import { businessTypeNames } from '@/store/declarationStore';

interface ReportData {
  declaration: Declaration;
  enterprise: Enterprise;
  license: License;
  premises: Premises;
  precheckResult: PrecheckResult | null;
  selfCheckScore: number;
  addReportLog: (type: ReportOperationType, name: string) => void;
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

const renderReportDOM = (data: ReportData): HTMLDivElement => {
  const { declaration, enterprise, license, premises, precheckResult, selfCheckScore } = data;
  const scoreLevel = getScoreLevel(selfCheckScore);
  const conclusion = getConclusion(precheckResult, selfCheckScore);
  const reportDate = formatDate(new Date());
  const businessTypeText = businessTypeNames[declaration.businessType];

  const missingItems = precheckResult?.missingItems || [];
  const doubtItems = precheckResult?.doubtItems || [];
  const suggestionItems = precheckResult?.suggestions || [];

  const container = document.createElement('div');
  container.style.cssText = `
    width: 820px;
    padding: 40px;
    background: #ffffff;
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    color: #1f2937;
    position: relative;
  `;

  const itemBg = (type: string) => type === 'danger' ? '#FEF2F2' : type === 'warning' ? '#FFFBEB' : '#EFF6FF';
  const itemBorder = (type: string) => type === 'danger' ? '#DC2626' : type === 'warning' ? '#D97706' : '#0284C7';

  const renderItemCard = (item: any, type: string, idx: number) => `
    <div style="padding:14px;margin-bottom:10px;border-radius:6px;background:${itemBg(type)};border-left:3px solid ${itemBorder(type)};">
      <div style="font-weight:bold;font-size:14px;color:#111;margin-bottom:6px;">${idx + 1}. ${item.title}</div>
      <div style="font-size:13px;color:#555;margin-bottom:6px;white-space:pre-wrap;line-height:1.7;">${item.description}</div>
      <div style="font-size:13px;color:#1E3A8A;padding:6px 10px;background:rgba(30,58,138,0.08);border-radius:4px;line-height:1.7;">
        <strong>建议：</strong>${item.suggestion}
      </div>
    </div>
  `;

  const scoreColor = scoreLevel.color === '#059669' ? '5,150,105' : scoreLevel.color === '#D97706' ? '217,119,6' : '220,38,38';

  container.innerHTML = `
    <div style="position:fixed;top:45%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:72px;color:rgba(30,58,138,0.06);font-weight:bold;letter-spacing:8px;pointer-events:none;z-index:0;">预 审 专 用</div>

    <div style="position:relative;z-index:1;">
      <div style="text-align:center;border-bottom:3px double #1E3A8A;padding-bottom:18px;margin-bottom:26px;">
        <div style="font-size:24px;font-weight:bold;color:#1E3A8A;letter-spacing:2px;">危 险 化 学 品 经 营 许 可 证</div>
        <div style="font-size:24px;font-weight:bold;color:#1E3A8A;letter-spacing:2px;margin-top:6px;">换 证 预 审 报 告</div>
        <div style="font-size:12px;color:#6b7280;margin-top:14px;">报告编号：${declaration.id}　｜　预审日期：${reportDate}</div>
      </div>

      <div style="margin-bottom:24px;">
        <div style="font-size:16px;font-weight:bold;color:#1E3A8A;border-left:4px solid #1E3A8A;padding-left:10px;margin-bottom:12px;">一、企业基本信息</div>
        <div style="background:#F8FAFC;border-radius:6px;padding:14px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
          ${[
            ['企业名称', enterprise.name],
            ['统一社会信用代码', enterprise.creditCode],
            ['法定代表人', enterprise.legalPerson],
            ['经营方式', businessTypeText],
            ['注册地址', enterprise.registeredAddress, true],
            ['经营地址', premises.businessAddress || enterprise.businessAddress, true],
            ['联系人', enterprise.contactPerson],
            ['联系电话', enterprise.contactPhone],
          ].map(([k, v, full]) => `
            <div style="${full ? 'grid-column:1/-1;' : ''}padding:6px 0;border-bottom:1px dashed #e5e7eb;">
              <span style="color:#6b7280;display:inline-block;width:115px;">${k}</span>
              <span style="color:#111;">${v || '—'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <div style="font-size:16px;font-weight:bold;color:#1E3A8A;border-left:4px solid #1E3A8A;padding-left:10px;margin-bottom:12px;">二、原许可证信息</div>
        <div style="background:#F8FAFC;border-radius:6px;padding:14px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
          ${[
            ['许可证号', license.licenseNumber],
            ['有效期至', license.validTo],
            ['许可范围', license.scope, true],
          ].map(([k, v, full]) => `
            <div style="${full ? 'grid-column:1/-1;' : ''}padding:6px 0;border-bottom:1px dashed #e5e7eb;">
              <span style="color:#6b7280;display:inline-block;width:115px;">${k}</span>
              <span style="color:#111;">${v || '—'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <div style="font-size:16px;font-weight:bold;color:#1E3A8A;border-left:4px solid #1E3A8A;padding-left:10px;margin-bottom:12px;">三、预审评分</div>
        <div style="text-align:center;padding:22px;background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-radius:8px;margin-bottom:16px;">
          <div style="font-size:56px;font-weight:bold;color:rgb(${scoreColor});line-height:1;">${selfCheckScore}</div>
          <div style="font-size:14px;color:#4b5563;margin-top:10px;">自查打分（满分 100 分）</div>
          <div style="display:inline-block;padding:4px 14px;background:rgb(${scoreColor});color:white;border-radius:20px;font-size:13px;margin-top:10px;font-weight:500;">${scoreLevel.text}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
          ${[
            ['缺失项', missingItems.length, '#FEF2F2', '#DC2626'],
            ['疑点项', doubtItems.length, '#FFFBEB', '#D97706'],
            ['建议项', suggestionItems.length, '#EFF6FF', '#0284C7'],
          ].map(([label, count, bg, color]) => `
            <div style="text-align:center;padding:14px;background:${bg};border-radius:6px;border:1px solid rgba(0,0,0,0.05);">
              <div style="font-size:24px;font-weight:bold;color:${color};">${count}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">${label}</div>
            </div>
          `).join('')}
        </div>
        <div style="padding:16px;background:#F8FAFC;border-left:4px solid #1E3A8A;border-radius:4px;">
          <div style="font-size:13px;color:#1E3A8A;font-weight:bold;margin-bottom:5px;">预审结论</div>
          <div style="font-size:14px;color:#111;">${conclusion}</div>
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <div style="font-size:16px;font-weight:bold;color:#1E3A8A;border-left:4px solid #1E3A8A;padding-left:10px;margin-bottom:12px;">四、缺失项清单</div>
        ${missingItems.length === 0
          ? '<div style="text-align:center;padding:20px;color:#059669;font-size:13px;background:#ECFDF5;border-radius:6px;">✓ 无缺失项，必填材料齐全</div>'
          : missingItems.map((item, i) => renderItemCard(item, 'danger', i)).join('')}
      </div>

      <div style="margin-bottom:24px;">
        <div style="font-size:16px;font-weight:bold;color:#1E3A8A;border-left:4px solid #1E3A8A;padding-left:10px;margin-bottom:12px;">五、疑点说明</div>
        ${doubtItems.length === 0
          ? '<div style="text-align:center;padding:20px;color:#059669;font-size:13px;background:#ECFDF5;border-radius:6px;">✓ 无疑点项，信息填报一致</div>'
          : doubtItems.map((item, i) => renderItemCard(item, 'warning', i)).join('')}
      </div>

      <div style="margin-bottom:24px;">
        <div style="font-size:16px;font-weight:bold;color:#1E3A8A;border-left:4px solid #1E3A8A;padding-left:10px;margin-bottom:12px;">六、修改建议</div>
        ${suggestionItems.length === 0
          ? '<div style="text-align:center;padding:20px;color:#059669;font-size:13px;background:#ECFDF5;border-radius:6px;">✓ 无修改建议，材料符合要求</div>'
          : suggestionItems.map((item, i) => renderItemCard(item, 'info', i)).join('')}
      </div>

      <div style="margin-top:30px;padding-top:18px;border-top:1px solid #e5e7eb;">
        <div style="display:flex;justify-content:space-around;margin-bottom:30px;">
          <div style="text-align:center;">
            <div style="width:180px;height:40px;border-bottom:1px solid #374151;margin:0 auto;"></div>
            <div style="font-size:12px;color:#6b7280;margin-top:6px;">企业经办人签字</div>
          </div>
          <div style="text-align:center;">
            <div style="width:180px;height:40px;border-bottom:1px solid #374151;margin:0 auto;"></div>
            <div style="font-size:12px;color:#6b7280;margin-top:6px;">预审员签字</div>
          </div>
          <div style="text-align:center;">
            <div style="width:180px;height:40px;border-bottom:1px solid #374151;margin:0 auto;"></div>
            <div style="font-size:12px;color:#6b7280;margin-top:6px;">日期</div>
          </div>
        </div>
        <div style="text-align:center;font-size:11px;color:#9CA3AF;line-height:1.8;">
          本报告为预审参考，不替代正式审批。正式办理请以窗口受理结果为准。<br/>
          报告生成时间：${new Date().toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  return container;
};

const captureDOM = async (el: HTMLElement): Promise<string> => {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });
  document.body.removeChild(el);
  return canvas.toDataURL('image/jpeg', 0.95);
};

export async function generatePDF(data: ReportData): Promise<void> {
  const container = renderReportDOM(data);
  const dataUrl = await captureDOM(container);

  const img = new Image();
  img.src = dataUrl;
  await new Promise((resolve) => { img.onload = resolve; });

  const imgWidth = img.width;
  const imgHeight = img.height;

  const pdf = new jsPDF({
    orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const pxToMmX = pageWidth / imgWidth;
  const pxToMmY = pageHeight / imgHeight;
  const pxToMm = Math.min(pxToMmX, pxToMmY);

  const drawWidth = imgWidth * pxToMm;
  const drawHeight = imgHeight * pxToMm;
  const offsetX = (pageWidth - drawWidth) / 2;

  pdf.addImage(dataUrl, 'JPEG', offsetX, 0, drawWidth, drawHeight);

  const fileName = `预审报告_${data.enterprise.name || '企业'}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);

  data.addReportLog('download', '下载PDF报告');
}

export async function printReport(data: ReportData): Promise<void> {
  const printWindow = window.open('', '_blank', 'width=900,height=1100');

  if (!printWindow) {
    alert('请允许弹出窗口以打印报告');
    return;
  }

  const container = renderReportDOM(data);
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>预审报告 - ${data.enterprise.name || '企业'}</title>
      <meta charset="UTF-8" />
      <style>
        @media print {
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body></body>
    </html>
  `);
  printWindow.document.body.appendChild(container);
  printWindow.document.close();

  await new Promise(resolve => setTimeout(resolve, 800));

  printWindow.focus();
  try {
    printWindow.print();
  } catch (e) {
    // ignore
  }

  data.addReportLog('print', '打印报告');
}

export function previewReport(data: ReportData): void {
  const printWindow = window.open('', '_blank', 'width=920,height=1100');

  if (!printWindow) {
    alert('请允许弹出窗口以预览报告');
    return;
  }

  const container = renderReportDOM(data);
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>预审报告预览 - ${data.enterprise.name || '企业'}</title>
      <meta charset="UTF-8" />
      <style>
        body { margin: 0; padding: 0; background: #f3f4f6; }
        .toolbar { position:fixed; top:0; left:0; right:0; z-index:10; padding:10px 20px; background:#1E3A8A; color:#fff;
          display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
        .toolbar-title { font-size:15px; font-weight:500; }
        .toolbar-btns { display:flex; gap:8px; }
        .toolbar-btn { padding:6px 14px; border:1px solid rgba(255,255,255,0.3); background:transparent;
          color:#fff; font-size:13px; border-radius:4px; cursor:pointer; }
        .toolbar-btn:hover { background:rgba(255,255,255,0.1); }
        .report-wrap { padding-top:56px; display:flex; justify-content:center; }
        @media print {
          .toolbar { display: none !important; }
          .report-wrap { padding-top: 0; }
          body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <div class="toolbar-title">📄 预审报告预览</div>
        <div class="toolbar-btns">
          <button class="toolbar-btn" onclick="window.print()">🖨️ 打印</button>
        </div>
      </div>
      <div class="report-wrap"></div>
    </body>
    </html>
  `);
  printWindow.document.body.querySelector('.report-wrap')!.appendChild(container);
  printWindow.document.close();

  data.addReportLog('preview', '预览报告');
}
