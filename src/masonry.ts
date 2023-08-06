function resizeGridItem(grid: HTMLElement, item: HTMLElement) {
    const rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows').replace('px', ''));
    const rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap').replace('px', ''));
    const contentHeight = item.querySelector('.container')?.getBoundingClientRect().height || 0
    const rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));
    item.style.gridRowEnd = "span " + rowSpan;
}

function resizeAllGridItems(grid: HTMLElement | null, itemClass: string) {
    if (grid) {
        const allItems = document.getElementsByClassName(itemClass);
        for (let x = 0; x < allItems.length; x++) {
            resizeGridItem(grid, (allItems[x] as HTMLElement));
        }
    }
}

export function setupMasonry(gridRoot: HTMLElement | null, itemClass: string) {
    const callback = () => {
        resizeAllGridItems(gridRoot, itemClass);
    }

    window.onload = callback;
    window.addEventListener("resize", callback);

    return callback;
}
