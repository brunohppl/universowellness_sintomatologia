import { getAreaNome } from '../data/painAreas'

function escapeCsvField(value) {
  const str = String(value ?? '')
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportSubmissionsToCsv(rows, filename = 'sintomatologia.csv') {
  const headers = ['Nome', 'Setor', 'Matricula', 'Data', 'Areas_de_dor', 'Observacoes', 'Registrado_em']
  const lines = [headers.join(';')]

  rows.forEach((r) => {
    const areas = (r.areas_dor ?? []).map(getAreaNome).join(', ')
    lines.push(
      [
        r.nome,
        r.setor,
        r.matricula ?? '',
        r.data_registro,
        areas,
        r.observacoes ?? '',
        new Date(r.created_at).toLocaleString('pt-BR')
      ]
        .map(escapeCsvField)
        .join(';')
    )
  })

  // BOM para o Excel reconhecer acentuação em UTF-8
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
