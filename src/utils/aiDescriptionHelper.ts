/**
 * Utility to generate a polished, marketing-friendly short description from technical specifications
 * by calling the server-side Gemini 3.8 Flash API endpoint.
 *
 * @param specs An object of specifications (e.g. { Wattage: "65W", Port: "Type-C" })
 *              or an array of specification objects (e.g. [{ label: "Wattage", value: "65W" }]).
 * @returns A promise resolving to the polished short description string.
 */
export async function generateProductDescription(
  specs: Record<string, string> | Array<{ label: string; value: string }>
): Promise<string> {
  const formattedSpecs = Array.isArray(specs)
    ? specs
    : Object.entries(specs).map(([label, value]) => ({ label, value }));

  try {
    const res = await fetch('/api/admin/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Product Description',
        specs: formattedSpecs,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data && json.data.shortDescription) {
        return json.data.shortDescription;
      }
    }
  } catch (err) {
    console.error('Error generating description in utility:', err);
  }

  // Fallback if API fails or is offline
  const listStr = Array.isArray(specs)
    ? specs.map((s) => `${s.label}: ${s.value}`).join(', ')
    : Object.entries(specs)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

  return `Engineered for premium performance featuring: ${listStr}. High-efficiency mobile accessory built with durable materials.`;
}
