import { ALL, parseJSON } from 'partial-json';

export function parseUntilJson(jsonstr: string): Record<string, any> {
  let jsonRes: Record<string, any> | string = jsonstr;
  jsonRes = jsonRes.replaceAll('\n', '')
  if (jsonRes.startsWith('```json')) {
    jsonRes = jsonRes.replace('```json', '');
  }
  // if (jsonRes.startsWith('`') || jsonRes.endsWith('`')) {
  //   jsonRes = jsonRes.replaceAll('```', '');
  // }
  try {
    const properlyParsedJson = JSON.parse(jsonRes);
    if (typeof properlyParsedJson === 'object' && properlyParsedJson !== null) {
      return properlyParsedJson;
    } else {
      jsonRes = properlyParsedJson;
    }
  } catch (error) {
    console.error(error);
  }
  const curlIndex =
    jsonRes.indexOf('{') === -1 ? jsonRes.length : jsonRes.indexOf('{');
  const sqIndex =
    jsonRes.indexOf('[') === -1 ? jsonRes.length : jsonRes.indexOf('[');
  jsonRes = jsonRes.slice(Math.min(curlIndex, sqIndex));

  if (jsonRes.startsWith('```json')) {
    jsonRes = jsonRes.replace('```json', '');
  }
  // if (jsonRes.startsWith('`') || jsonRes.endsWith('`')) {
  //   jsonRes = jsonRes.replaceAll('```', '');
  // }
  jsonRes = jsonRes.replaceAll('{\\n', '{').replaceAll('\\n}', '}');
  try {
    while (typeof jsonRes === 'string') {
      jsonRes = parseJSON(jsonRes, ALL);
    }
    return jsonRes;
  } catch (error) {
    console.error(error);
    return {};
  }
}


// console.log(parseUntilJson(`{"type":"lead","data":{"Linkedin Url":"http://www.linkedin.com/in/nanjunda-sg-50690866","Full Name":"Nanjunda Sg","First Name":"Nanjunda","Last Name":"Sg","Email":"","Email Status":"unavailable","Job Title":"Co Founder","Company Name":"RentMyStay","Company Website":"http://www.rentmystay.com","City":"Bengaluru","State":"Karnataka","Country":"India","Industry":"consumer services","Keywords":"no brokerage,residential property search,online residential property,short term rentals,furnished accomodation,long term rentals,property management,marketplaces,online travel,social travel,information technology,consumer internet,internet,furnished homes,service apartments,bangalore rentals,brokerage-free,house for rent,studio apartments,1bhk,2bhk,semi-furnished homes,co-living spaces,paying guest accommodation,affordable housing,temporary stay,fully furnished,online booking,flexible lease,tenant services,amenities included,move-in ready,budget accommodation,student housing,family rentals,work from home,short stay apartments,property listings,expat housing,real estate bangalore,tenant support,online rental platform,free mobility,network homes,cleaning services,maintenance support,customer reviews,safe housing,community living,rental agreements,local experiences,temporary accommodation,easy booking,virtual tours,professional rentals,amenities check,enterprise software,enterprises,computer software,information technology & services,b2b,consumers,leisure, travel & tourism","Employees":"54","Company City":"Bengaluru","Company State":"Karnataka","Company Country":"India","Company Linkedin Url":"http://www.linkedin.com/company/rentmystay","Company Twitter Url":"https://twitter.com/rentmystay","Company Facebook Url":"https://www.facebook.com/rentmystay","Company Phone Numbers":"","Twitter Url":"","Facebook Url":"","id":"26283165-8d61-4efd-b540-6b67d9a101c7","groupName":"General Business Solutions","pitch":"At Alchemyst AI, we’ve built a future where your sales team operates as a highly efficient, AI-driven workforce. Our flagship platform, Maya, transforms your sales processes from manual to fully automated, leveraging a database of over 300 million verified prospects to identify high-potential leads through behavioral signals like website visits. With real-time dynamic lead scoring and predictive analytics, Maya ensures you focus only on sales-ready prospects, boosting productivity by 20% and return on investment by 30%.\n\nImagine personalized outreach at scale—Maya crafts tailored messages for each prospect, whether it’s via email, WhatsApp, Telegram, or social media, ensuring maximum engagement. Our automated nurture flows take care of follow-ups and warm-up emails, increasing sales-ready conversions by 50% and speeding up deal cycles. Data hygiene and enrichment are no longer challenges; our platform cleans and enriches CRM data, ensuring accuracy and actionable insights.\n\nWith real-time dashboards and insights, you can make data-driven decisions instantly, optimizing your sales efforts. No more guesswork—Maya provides live analytics on lead quality, engagement trends, conversion rates, and ROI, empowering you to stay ahead of the competition.\n\nBy integrating Maya into your sales operations, you’re not just automating tasks; you’re building a robust AI workforce that enhances efficiency, accuracy, and pipeline velocity. This isn’t just a tool—it’s a game-changer for your business.\n\nReady to elevate your sales team to the next level? Let’s transform your manual sales efforts into a seamless, AI-driven workflow. Contact us today to learn how Maya can revolutionize your sales processes and drive exponential growth.\n\nGet started with Alchemyst AI and experience the power of intelligent automation."},"timestamp":"2025-06-06T11:33:40.699Z"}`));