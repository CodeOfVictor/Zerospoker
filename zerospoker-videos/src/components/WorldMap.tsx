import React, { useState, useEffect } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Link from "@mui/material/Link";
import { feature } from "topojson-client";
import countries from "i18n-iso-countries";
import es from "i18n-iso-countries/langs/es.json";
import AddIcon from "@mui/icons-material/Add"; // Zoom in
import RemoveIcon from "@mui/icons-material/Remove"; // Zoom out
import MapIcon from "@mui/icons-material/Map"; // Reset
import IconButton from "@mui/material/IconButton";

import worldTopo from "../json/countries-50m.json";
import youtubeVideos from "../json/youtube_all_videos_tagged.json";

// Register Spanish locale for country names
countries.registerLocale(es);

// Normalize country names to match i18n-iso-countries
const normalizeCountryName = (country: string): string => {
  switch (country) {
    case "Corea del Sur":
      return "República de Corea"; // Official Spanish name for South Korea
    case "Corea del Norte":
      return "República Popular Democrática de Corea"; // North Korea
    // Add more normalizations as needed for other mismatches
    default:
      return country;
  }
};

// Truncate text to a specified length with ellipsis
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const WorldMap: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);
  const [videoCountries, setVideoCountries] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1); // Initial zoom level
  const [center, setCenter] = useState([0, 0]); // Initial center coordinates

  useEffect(() => {
    // Process TopoJSON for map
    try {
      const geo = feature(worldTopo, worldTopo.objects.countries);
      setGeoData(geo);
    } catch (error) {
      // Handle error silently
    }

    // Extract Spanish country names with videos
    const countrySet = new Set<string>();
    youtubeVideos.forEach((video: any) => {
      video.countries.forEach((country: string) => {
        const normalizedCountry = normalizeCountryName(country);
        countrySet.add(normalizedCountry);
      });
    });
    setVideoCountries(countrySet);
  }, []);

  const handleCountryClick = (id: string, fallbackName: string) => {
    const spanishName = countries.getName(id, "es", { select: "official" }) || fallbackName;
    setSelectedCountry(spanishName);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedCountry(null);
  };

  // Filter videos for the selected country with normalization
  const getCountryVideos = () => {
    if (!selectedCountry) return [];
    return youtubeVideos.filter((video: any) =>
      video.countries.some((country: string) => normalizeCountryName(country) === selectedCountry)
    );
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 1, 20)); // Max zoom from ZoomableGroup
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 1, 1)); // Min zoom from ZoomableGroup
  };

  const handleReset = () => {
    setZoom(1); // Reset to initial zoom
    setCenter([0, 0]); // Reset to initial center
  };

  if (!geoData) return <div>Loading map...</div>;

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Zoom Controls */}
      <Box
        sx={{
          position: "absolute",
          bottom: 10,
          right: 10,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <IconButton onClick={handleZoomIn} color="primary" aria-label="Zoom in">
          <AddIcon />
        </IconButton>
        <IconButton onClick={handleZoomOut} color="primary" aria-label="Zoom out">
          <RemoveIcon />
        </IconButton>
        <IconButton onClick={handleReset} color="primary" aria-label="Reset map">
          <MapIcon />
        </IconButton>
      </Box>

      {/* Container of the map */}
      <div
        style={{
          width: drawerOpen ? "calc(100% - 300px)" : "100%",
          height: "100%",
          transition: "width 0.3s ease",
        }}
      >
        <ComposableMap
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <ZoomableGroup zoom={zoom} center={center} minZoom={1} maxZoom={20}>
            <Geographies geography={geoData}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const id = geo.id || "Unknown";
                  const name = geo.properties?.name || "Unknown";
                  const spanishName = countries.getName(id, "es", { select: "official" }) || name;
                  const isSelected = selectedCountry === spanishName;
                  const hasVideos = videoCountries.has(spanishName);

                  return (
                    <Geography
                      key={geo.rsmKey || geo.id}
                      geography={geo}
                      onClick={() => handleCountryClick(id, name)}
                      style={{
                        default: {
                          fill: isSelected
                            ? "#E42"
                            : hasVideos
                            ? "#1976D2" // Light blue for countries with videos
                            : "#D6D6DA",
                          outline: "none",
                          cursor: "pointer",
                        },
                        hover: {
                          fill: isSelected
                            ? "#E42"
                            : hasVideos
                            ? "#87CEEB" // Slightly darker blue on hover
                            : "#F53",
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: {
                          fill: "#E42",
                          outline: "none",
                          cursor: "pointer",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Drawer responsive */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "80vw", sm: "450px" },
            maxWidth: "100%",
            boxSizing: "border-box",
            backgroundColor: "#f0f7fa", // Soft blue background
            color: "#333", // Dark text for contrast
          },
        }}
      >
        <Box p={3}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: "#5ac3dd", // Accent color for header
              borderBottom: "2px solid #5ac3dd",
              paddingBottom: 1,
              marginBottom: 2,
            }}
          >
            Información del País
          </Typography>
          {selectedCountry && (
            <>
              <Typography
                variant="body1"
                sx={{
                  fontSize: "1.2rem",
                  fontWeight: 500,
                  color: "#444",
                  marginBottom: 2,
                }}
              >
                {selectedCountry}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#5ac3dd",
                  marginBottom: 1,
                }}
              >
                Videos:
              </Typography>
              <List>
                {getCountryVideos().length > 0 ? (
                  getCountryVideos().map((video: any, index: number) => (
                    <ListItem
                      key={index}
                      sx={{
                        backgroundColor: "#fff",
                        borderRadius: 1,
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        marginBottom: 2,
                        padding: 2,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Link
                            href={video.url}
                            target="_blank"
                            rel="noopener"
                            sx={{
                              color: "#1976d2",
                              textDecoration: "none",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            {video.title}
                          </Link>
                        }
                        secondary={
                          <>
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              style={{
                                width: "100%",
                                maxWidth: "250px",
                                height: "auto",
                                borderRadius: 4,
                                marginTop: "8px",
                                marginBottom: "8px",
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#666",
                                fontSize: "0.9rem",
                                marginBottom: 1,
                              }}
                            >
                              {truncateText(video.description, 100)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#888",
                                fontStyle: "italic",
                              }}
                            >
                              Fecha: {video.upload_date}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666",
                      fontStyle: "italic",
                    }}
                  >
                    No hay videos para este país.
                  </Typography>
                )}
              </List>
            </>
          )}
        </Box>
      </Drawer>
    </div>
  );
};