import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plane, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import airplaneHero from '@/assets/airplane-hero.jpg';

interface Airport {
  code: string;
  name: string;
}

interface Flight {
  outbound: {
    departureStation: string;
    arrivalStation: string;
    discountPrice: number;
    originalPrice: number;
    departureDate: string;
    departureTime: string;
  };
  return: {
    departureStation: string;
    arrivalStation: string;
    discountPrice: number;
    originalPrice: number;
    departureDate: string;
    departureTime: string;
  };
  total_discount_price: number;
  total_original_price: number;
}

const API_BASE = 'http://127.0.0.1:8000';

const FlightSearch = () => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDestinations, setExpandedDestinations] = useState<Set<string>>(new Set());
  
  // Search form state
  const [arrivalCode, setArrivalCode] = useState<string>('ALL');
  const [daySpan, setDaySpan] = useState<number[]>([1]);
  const [maxPrice, setMaxPrice] = useState<number[]>([4000]);

  // Fetch airports on component mount
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch(`${API_BASE}/airports`);
        if (response.ok) {
          const data = await response.json();
          setAirports(data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch airports',
          variant: 'destructive'
        });
      }
    };

    fetchAirports();
  }, []);

  const searchFlights = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        arrival_code: arrivalCode,
        day_span: daySpan[0].toString(),
        max_price: maxPrice[0].toString()
      });

      const response = await fetch(`${API_BASE}/search-flights?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFlights(data);
        toast({
          title: 'Success',
          description: `Found ${data.length} flights`
        });
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search flights',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshFlights = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/refresh-flights`, {
        method: 'POST'
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Flights refreshed successfully'
        });
        // Re-search with current parameters
        await searchFlights();
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh flights',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MKD',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Group flights by destination
  const groupedFlights = flights.reduce((acc, flight) => {
    const destination = flight.outbound.arrivalStation;
    if (!acc[destination]) {
      acc[destination] = [];
    }
    acc[destination].push(flight);
    return acc;
  }, {} as Record<string, Flight[]>);

  const toggleDestination = (destination: string) => {
    const newExpanded = new Set(expandedDestinations);
    if (newExpanded.has(destination)) {
      newExpanded.delete(destination);
    } else {
      newExpanded.add(destination);
    }
    setExpandedDestinations(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative h-[60vh] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${airplaneHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <div className="animate-float mb-6">
            <Plane className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Find Your Flight
          </h1>
          <p className="text-xl text-white/90 mb-8 drop-shadow-md">
            Search flights from Skopje to destinations worldwide
          </p>
        </div>
      </div>

      {/* Search Form */}
      <div className="container mx-auto px-4 -mt-20 relative z-20">
        <Card className="bg-gradient-card shadow-hero animate-slide-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Flights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Arrival Airport */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination</label>
                <Select value={arrivalCode} onValueChange={setArrivalCode}>
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="ALL">All Destinations</SelectItem>
                    {airports.map((airport) => (
                      <SelectItem key={airport.code} value={airport.code}>
                        {airport.name} ({airport.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day Span */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Day Span: {daySpan[0]} {daySpan[0] === 1 ? 'day' : 'days'}
                </label>
                <Slider
                  value={daySpan}
                  onValueChange={setDaySpan}
                  max={30}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Max Price */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Max Price: {formatPrice(maxPrice[0])}
                </label>
                <Slider
                  value={maxPrice}
                  onValueChange={setMaxPrice}
                  max={10000}
                  min={1000}
                  step={100}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                onClick={searchFlights} 
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-hover"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Flights
                  </>
                )}
              </Button>
              
              <Button 
                onClick={refreshFlights} 
                disabled={refreshing}
                variant="outline"
                className="px-6"
              >
                {refreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flight Results */}
      {flights.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Flight Results ({flights.length})</h2>
          <div className="space-y-4">
            {Object.entries(groupedFlights).map(([destination, destinationFlights]) => (
              <Collapsible 
                key={destination}
                open={expandedDestinations.has(destination)}
                onOpenChange={() => toggleDestination(destination)}
              >
                <Card className="bg-gradient-card shadow-card hover:shadow-flight transition-shadow duration-300">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-muted/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <CardTitle className="text-lg">{destination}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {destinationFlights.length} flight{destinationFlights.length !== 1 ? 's' : ''} available
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Starting from</p>
                            <p className="text-lg font-bold text-primary">
                              {formatPrice(Math.min(...destinationFlights.map(f => f.total_discount_price)))}
                            </p>
                          </div>
                          {expandedDestinations.has(destination) ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {destinationFlights.map((flight, index) => (
                          <Card key={index} className="bg-muted/20 border-muted">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Outbound Flight */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-primary text-sm">Outbound</h4>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      {flight.outbound.departureStation}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      to {flight.outbound.arrivalStation}
                                    </p>
                                    <p className="text-sm font-medium">
                                      {flight.outbound.departureDate} at {flight.outbound.departureTime}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-primary">
                                        {formatPrice(flight.outbound.discountPrice)}
                                      </span>
                                      {flight.outbound.originalPrice > flight.outbound.discountPrice && (
                                        <span className="text-xs text-muted-foreground line-through">
                                          {formatPrice(flight.outbound.originalPrice)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Return Flight */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-accent text-sm">Return</h4>
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      {flight.return.departureStation}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      to {flight.return.arrivalStation}
                                    </p>
                                    <p className="text-sm font-medium">
                                      {flight.return.departureDate} at {flight.return.departureTime}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-accent">
                                        {formatPrice(flight.return.discountPrice)}
                                      </span>
                                      {flight.return.originalPrice > flight.return.discountPrice && (
                                        <span className="text-xs text-muted-foreground line-through">
                                          {formatPrice(flight.return.originalPrice)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Total */}
                                <div className="space-y-2 lg:text-right">
                                  <h4 className="font-semibold text-sm">Total Price</h4>
                                  <div className="space-y-1">
                                    <div className="text-xl font-bold text-primary">
                                      {formatPrice(flight.total_discount_price)}
                                    </div>
                                    {flight.total_original_price > flight.total_discount_price && (
                                      <div className="text-sm text-muted-foreground line-through">
                                        {formatPrice(flight.total_original_price)}
                                      </div>
                                    )}
                                    {flight.total_original_price > flight.total_discount_price && (
                                      <div className="text-xs text-accent font-medium">
                                        Save {formatPrice(flight.total_original_price - flight.total_discount_price)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightSearch;