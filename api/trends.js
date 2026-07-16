import { XMLParser } from 'fast-xml-parser';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Aceptar el país desde query o por defecto CO (Colombia)
  const { geo = 'CO' } = req.query;

  try {
    const response = await fetch(`https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`);
    
    if (!response.ok) {
      throw new Error(`Google Trends respondió con estado: ${response.status}`);
    }

    const xmlData = await response.text();
    const parser = new XMLParser();
    const result = parser.parse(xmlData);

    const items = result?.rss?.channel?.item || [];
    
    // Google Trends RSS returns objects for each item
    const trendsList = Array.isArray(items) ? items : [items];
    const trends = trendsList.map(item => item.title).filter(Boolean);

    res.status(200).json({ success: true, geo, trends });
  } catch (error) {
    console.error('Error fetching Google Trends:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trends', details: error.message });
  }
}
