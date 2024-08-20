export const items: Item[] = [];
type Item = {
    id: number;
    name: string;
};

for (let i = 1; i <= 100; i++) {
    items.push({ id: i, name: `Item ${i}` });
}

export const perPage = 10;

export const getItems = (req: any, res: any) => {
    const page = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;

    const paginatedItems = items.slice(startIndex, endIndex);

    const totalPages = Math.ceil(items.length / perPage);

    let prevPage = page - 1;
    if (prevPage < 1) {
        prevPage = 1;
    }

    let nextPage = page + 1;
    if (nextPage > totalPages) {
        nextPage = totalPages;
    }

    const response = {
        page,
        perPage,
        totalItems: items.length,
        totalPages,
        data: paginatedItems,
        prev: page > 1 ? `/items?page=${prevPage}` : null,
        next: page < totalPages ? `/items?page=${nextPage}` : null,
    };

    res.json(response);
};
