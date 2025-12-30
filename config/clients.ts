
export interface ClientConfig {
  id: string;
  pass: string;
  name: string;
  location: string;
  scriptUrl: string;
  brandingColor: string;
}

export const CLIENTS_REGISTRY: ClientConfig[] = [
  {
    id: "admin",
    pass: "EPZ1944",
    name: "AUTOPARTENON",
    location: "Quinlan, Texas",
    scriptUrl: "https://script.google.com/macros/s/AKfycbzIQzgFjXMnnOQzSeMQj8Wt30bsmtB7chswBRwISac_mpCRtpAhe9F2cgGN0WkAMoL6/exec",
    brandingColor: "#f59e0b" // Amber
  },
  {
    id: "texas_recycling",
    pass: "TX2025",
    name: "TEXAS RECYCLING",
    location: "Dallas, Texas",
    scriptUrl: "https://script.google.com/macros/s/AKfycbzIQzgFjXMnnOQzSeMQj8Wt30bsmtB7chswBRwISac_mpCRtpAhe9F2cgGN0WkAMoL6/exec", // Ejemplo, cada uno tendría la suya
    brandingColor: "#3b82f6" // Blue
  }
];
