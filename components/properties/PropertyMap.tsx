import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Property, OperationType } from '../../types';
import { Home, MapPin, DollarSign } from 'lucide-react';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
    properties: Property[];
    onPropertyClick: (property: Property) => void;
    center?: [number, number];
    zoom?: number;
}

// Component to auto-fit bounds
const AutoFitBounds: React.FC<{ properties: Property[] }> = ({ properties }) => {
    const map = useMap();

    React.useEffect(() => {
        if (properties.length > 0) {
            const validCoords = properties
                .filter(p => p.coordinates?.lat && p.coordinates?.lng)
                .map(p => [p.coordinates!.lat, p.coordinates!.lng] as [number, number]);

            if (validCoords.length > 0) {
                const bounds = L.latLngBounds(validCoords);
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
    }, [properties, map]);

    return null;
};

const PropertyMap: React.FC<PropertyMapProps> = ({
    properties,
    onPropertyClick,
    center = [25.5428, -103.4067], // Torreón, México default
    zoom = 12
}) => {
    const formatCurrency = (amount: number, currency: 'MXN' | 'USD') => {
        return new Intl.NumberFormat(currency === 'MXN' ? 'es-MX' : 'en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Filter properties with valid coordinates
    const validProperties = properties.filter(
        p => p.coordinates?.lat && p.coordinates?.lng
    );

    if (validProperties.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900/50 border border-white/10 rounded-3xl">
                <div className="text-center p-8">
                    <MapPin size={48} className="mx-auto text-zinc-600 mb-4" />
                    <p className="text-zinc-400 text-sm">
                        No hay propiedades con ubicación disponible
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <AutoFitBounds properties={validProperties} />

                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={50}
                >
                    {validProperties.map((property) => (
                        <Marker
                            key={property.id}
                            position={[property.coordinates!.lat, property.coordinates!.lng]}
                            eventHandlers={{
                                click: () => onPropertyClick(property)
                            }}
                        >
                            <Popup>
                                <div className="min-w-[200px]">
                                    <h3 className="font-bold text-sm mb-2">{property.title}</h3>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={12} />
                                            <span>{property.address.city}, {property.address.state}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={12} />
                                            <span className="font-bold">
                                                {property.operation === OperationType.VENTA
                                                    ? formatCurrency(property.salePrice || 0, property.currency)
                                                    : `${formatCurrency(property.rentPrice || 0, property.currency)}/mes`
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Home size={12} />
                                            <span>
                                                {property.specs.bedrooms} rec • {property.specs.bathrooms} baños
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onPropertyClick(property)}
                                        className="mt-3 w-full bg-amber-500 text-black text-xs font-bold py-2 px-3 rounded-lg hover:bg-amber-600 transition-colors"
                                    >
                                        Ver Detalles
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
};

export default PropertyMap;
