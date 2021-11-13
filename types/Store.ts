type Store = {
  name: string;
  website: string;
  pollRate: number;
  needsReload: boolean;
  scrapers: {
    product: {
      name: string;
      url: string;
    }
    data: {
      userAgent: string;
      selectors: {
        waitFor: string;
        xpath: string;
        xpathIsOutOfStock: boolean;
        xpathProductPageUrl: string;
      }
    }
  }[];
}

export default Store;