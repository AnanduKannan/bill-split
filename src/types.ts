export interface Person {
  id: string;
  name: string;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
}

export interface TaxItem {
  id: string;
  name: string;
  amount: number;
}

export interface Portion {
  personId: string;
  count: number;
}

export interface Assignment {
  itemId: string;
  portions: Portion[];
}

export interface BillParseResult {
  items: {
    name: string;
    price: number;
  }[];
  taxes: {
    name: string;
    amount: number;
  }[];
  total?: number;
}
