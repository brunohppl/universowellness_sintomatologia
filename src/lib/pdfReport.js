// Geração do relatório em PDF: gráficos redesenhados com os primitivos do
// jsPDF (não é uma captura de tela dos gráficos da tela, o que evita
// problemas de fonte/renderização) + um resumo escrito gerado a partir dos
// números reais (sem inventar nada) + a tabela detalhada.
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getAreaNome } from '../data/painAreas'

function formatarData(iso) {
  if (!iso) return '-'
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

function carregarLogoComoDataUrl() {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = '/logo-universo-wellness.png'
  })
}

function gerarResumoTexto({ total, semDor, areaTopNome, areaTopCount, setorTopNome, setorTopCount, dataInicio, dataFim }) {
  if (total === 0) {
    return 'Nenhum registro foi encontrado para o período e os filtros selecionados.'
  }
  const pctSemDor = Math.round((semDor / total) * 100)
  const partes = [
    `Entre ${formatarData(dataInicio)} e ${formatarData(dataFim)}, foram coletados ${total} registro(s) de sintomatologia.`,
    `${semDor} desses registros (${pctSemDor}%) indicaram não haver nenhum desconforto no momento do preenchimento.`
  ]
  if (areaTopNome) {
    partes.push(`A área corporal mais reportada foi "${areaTopNome}", presente em ${areaTopCount} registro(s).`)
  }
  if (setorTopNome) {
    partes.push(`O setor com maior número de relatos foi "${setorTopNome}", com ${setorTopCount} registro(s).`)
  }
  partes.push('Recomenda-se atenção especial às áreas e aos setores destacados na próxima avaliação ergonômica.')
  return partes.join(' ')
}

function desenharGraficoBarras(doc, dados, titulo, x, y, largura) {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20)
  doc.text(titulo, x, y)
  y += 6
  doc.setFont('helvetica', 'normal')

  if (!dados || dados.length === 0) {
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text('Sem dados para este período.', x, y)
    return y + 8
  }

  const maxValor = Math.max(...dados.map((d) => d.total), 1)
  const barAreaWidth = largura - 52
  const barHeight = 5.5
  const gap = 2.6

  dados.forEach((d) => {
    const label = (d.nome ?? d.setor ?? '').toString()
    const labelTruncado = label.length > 26 ? label.slice(0, 24) + '…' : label
    doc.setFontSize(8)
    doc.setTextColor(60)
    doc.text(labelTruncado, x, y + barHeight - 1.3)

    const barWidth = Math.max((d.total / maxValor) * barAreaWidth, 1)
    doc.setFillColor(232, 113, 74)
    doc.rect(x + 50, y, barWidth, barHeight, 'F')

    doc.setFontSize(7.5)
    doc.setTextColor(90)
    doc.text(String(d.total), x + 50 + barWidth + 2, y + barHeight - 1.3)

    y += barHeight + gap
  })

  return y + 2
}

export async function gerarRelatorioPdf({ filtros, rows, dadosAreaChart, dadosSetorChart, stats }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 16

  const logoDataUrl = await carregarLogoComoDataUrl()
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 14, y, 38, 10.9)
  }

  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20)
  doc.text('Relatório de Sintomatologia Dolorosa', pageWidth - 14, y + 5, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(110)
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 14, y + 11, { align: 'right' })
  doc.setTextColor(0)

  y += 22

  doc.setDrawColor(220)
  doc.line(14, y, pageWidth - 14, y)
  y += 7

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Filtros aplicados', 14, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(70)
  ;[
    `Período: ${formatarData(filtros.dataInicio)} a ${formatarData(filtros.dataFim)}`,
    `Cliente: ${filtros.empresaNome || 'Todos'}`,
    `Filial: ${filtros.filialNome || 'Todas'}`,
    `Setor: ${filtros.setorNome || 'Todos'}`,
    `Área: ${filtros.areaNome || 'Todas'}`
  ].forEach((linha) => {
    doc.text(linha, 14, y)
    y += 4.6
  })
  doc.setTextColor(0)

  y += 5

  const cardW = (pageWidth - 28 - 12) / 4
  const cards = [
    { label: 'REGISTROS', valor: String(stats.total) },
    { label: 'SEM DESCONFORTO', valor: String(stats.semDor) },
    { label: 'ÁREA MAIS REPORTADA', valor: stats.areaTopNome || '—' },
    { label: 'SETOR MAIS AFETADO', valor: stats.setorTopNome || '—' }
  ]
  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 4)
    doc.setFillColor(234, 244, 253)
    doc.roundedRect(x, y, cardW, 19, 2, 2, 'F')
    doc.setFontSize(6.5)
    doc.setTextColor(100)
    doc.text(card.label, x + 3, y + 6)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20)
    const valorTruncado = card.valor.length > 20 ? card.valor.slice(0, 18) + '…' : card.valor
    doc.text(valorTruncado, x + 3, y + 14)
    doc.setFont('helvetica', 'normal')
  })
  y += 27

  y = desenharGraficoBarras(doc, dadosAreaChart.slice(0, 10), 'Áreas de desconforto mais reportadas', 14, y, pageWidth - 28)
  y += 6

  if (y > 220) {
    doc.addPage()
    y = 18
  }
  y = desenharGraficoBarras(doc, dadosSetorChart.slice(0, 10), 'Registros por setor', 14, y, pageWidth - 28)

  doc.addPage()
  y = 18
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20)
  doc.text('Resumo', 14, y)
  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40)
  const resumo = gerarResumoTexto({
    total: stats.total,
    semDor: stats.semDor,
    areaTopNome: stats.areaTopNome,
    areaTopCount: stats.areaTopCount,
    setorTopNome: stats.setorTopNome,
    setorTopCount: stats.setorTopCount,
    dataInicio: filtros.dataInicio,
    dataFim: filtros.dataFim
  })
  const linhasResumo = doc.splitTextToSize(resumo, pageWidth - 28)
  doc.text(linhasResumo, 14, y)
  y += linhasResumo.length * 5.2 + 10

  if (rows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Nome', 'Setor', 'Data', 'Áreas']],
      body: rows.slice(0, 200).map((r) => [
        r.nome,
        r.setor,
        formatarData(r.data_registro),
        (r.areas_dor ?? []).length === 0 ? 'Sem dor' : r.areas_dor.map(getAreaNome).join(', ')
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [44, 111, 168] },
      margin: { left: 14, right: 14 }
    })
    if (rows.length > 200) {
      const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 6 : y + 10
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(
        `Mostrando os primeiros 200 de ${rows.length} registros. Use a exportação CSV para a lista completa.`,
        14,
        finalY
      )
    }
  }

  const nomeArquivo = `relatorio_sintomatologia_${filtros.dataInicio}_a_${filtros.dataFim}.pdf`
  doc.save(nomeArquivo)
}
