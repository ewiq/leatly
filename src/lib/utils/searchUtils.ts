export function normalizeText(text: string | undefined | null): string {
	if (!text) return '';
	return text
		.toString()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();
}

export function searchItem(item: any, query: string): boolean {
	const normalizedQuery = normalizeText(query);
	if (!normalizedQuery) return true;

	const textToSearch = [
		item.title,
		item.description,
		item.author,
		Array.isArray(item.category) ? item.category.join(' ') : item.category
	].join(' ');

	return normalizeText(textToSearch).includes(normalizedQuery);
}
