import { ALL, parseJSON } from "partial-json";

export function parseUntilJson(jsonstr: string): Record<string, any> {
  let jsonRes: Record<string, any> | string = jsonstr;

  try {
    const properlyParsedJson = JSON.parse(jsonRes);
    console.log(
      "\n\n===============================\nJSON parsed properly\n===============================\n\n",
    );
    if (typeof properlyParsedJson === "object" && properlyParsedJson !== null) {
      return properlyParsedJson;
    } else {
      jsonRes = properlyParsedJson;
    }
  } catch (error) {
    console.info(
      "\n\n===============================\nError parsing the JSON using regular JSON.parse...\n===============================\n",
    );
  }

  console.log(
    "\n=================\njsonRes type:\n=================\n",
    typeof jsonRes,
  );
  if (typeof jsonRes === "object") {
    console.log(Object.keys(jsonRes));
  }
  // console.log('\n=================\njsonRes:\n=================\n', jsonRes);
  const curlIndex =
    jsonRes.indexOf("{") === -1 ? jsonRes.length : jsonRes.indexOf("{");
  const sqIndex =
    jsonRes.indexOf("[") === -1 ? jsonRes.length : jsonRes.indexOf("[");
  jsonRes = jsonRes.slice(Math.min(curlIndex, sqIndex));

  if (jsonRes.startsWith("```json")) {
    jsonRes = jsonRes.replace("```json", "");
  }
  if (jsonRes.startsWith("`") || jsonRes.endsWith("`")) {
    jsonRes = jsonRes.replaceAll("```", "");
  }
  if (jsonRes.includes(`[\n    {`)) {
    jsonRes = jsonRes.replaceAll("[\n    {", "[{");
  }

  if (jsonRes.includes(`,\n    {`)) {
    jsonRes = jsonRes.replaceAll(",\n    {", ",{");
  }

  if (jsonRes.includes("}\n  ]", "}]")) {
    jsonRes = jsonRes.replaceAll("}\n  ]", "}]");
  }

  console.info("Filtered JSON res = ", jsonRes);
  jsonRes = jsonRes.replaceAll('",\n  ', '",');
  jsonRes = jsonRes.replaceAll("\n", "\\n");
  jsonRes = jsonRes.replaceAll("{\\n", "{").replaceAll("\\n}", "}");
  console.info(jsonRes);
  try {
    while (typeof jsonRes === "string") {
      jsonRes = parseJSON(jsonRes, ALL);
    }
    // console.info('\n\nParsed JSON using partial JSON parser = \n\n', jsonRes);
    return jsonRes;
  } catch (error) {
    console.info(
      "\n\n===============================\nError parsing the JSON...\n===============================\n",
    );
    console.info(error);
    return {};
  }
}

// console.log(
//   parseUntilJson(
//     `"{\n  \"countries\": [\"Switzerland\"],\n  \"titles\": [\"fundraiser\", \"fundraiser in瑞士\", \"fundraising\", \"fund raiser\"],\n  \"industries\": [],\n  \"technologies\": [],\n  \"company_domains\": [],\n  \"employee_count\": [],\n  \"annual_revenue\": [],\n  \"total_funding\": [],\n  \"keywords\": [],\n  \"cities\": [],\n  \"states\": [],\n  \"page\": 1,\n  \"per_page\": 100\n}"`
//   )
// );
