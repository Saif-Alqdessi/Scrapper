import React, { createContext, useContext, useState, useEffect } from "react";
import { mockData as initialMockData } from "../../data/mockData";

type Locale = "en" | "ar";
type SiteData = typeof initialMockData.en;

interface DataContextType extends SiteData {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(initialMockData);
  const [locale, setLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching the JSON payload from a FastAPI endpoint
    // e.g., GET http://localhost:8000/api/v1/sites/{lead_id}
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/sites/123");
        if (response.ok) {
          const apiData = await response.json();
          setData(apiData);
        } else {
          console.warn("Failed to fetch from API, falling back to mockData");
        }
      } catch (error) {
        console.warn("API not reachable, falling back to mockData", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Automatically update the HTML dir attribute for RTL support
  useEffect(() => {
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  const value: DataContextType = {
    ...data[locale],
    locale,
    setLocale,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useSiteData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useSiteData must be used within a DataProvider");
  }
  return context;
}
