export function convertToXml(emailsByCategory: any) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<emails>'
  
    for (const category in emailsByCategory) {
      xml += `\n  <category name="${category}">`
      emailsByCategory[category].forEach((email: any) => {
        xml += `\n    <email>`
        xml += `\n      <category>${email.category}</category>`
        xml += `\n      <title>${email.payload.headers.find((header: any) => header.name === 'Subject').value}</title>`
        xml += `\n      <content>${email.snippet}</content>`
        xml += `\n      <date>${email.payload.headers.find((header: any) => header.name === 'Date').value}</date>`
        xml += `\n    </email>`
      })
      xml += `\n  </category>`
    }
  
    xml += '\n</emails>'
    return xml
}