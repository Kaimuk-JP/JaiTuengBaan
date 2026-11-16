import {
  Controller,
  Get,
  Query,
  Logger,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Geocode')
@ApiBearerAuth('JWT-auth')
@Controller('geocode')
@UseGuards(JwtAuthGuard)
export class GeocodeController {
  private readonly logger = new Logger(GeocodeController.name);
  private readonly MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || '';
  private readonly RETRIES = 3;
  private readonly TIMEOUT = 3000;

  @Get('reverse')
  async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (
      isNaN(latNum) ||
      isNaN(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      throw new BadRequestException('ค่าพิกัด lat/lng ไม่ถูกต้อง');
    }

    if (this.MAPBOX_TOKEN) {
      try {
        const mapboxResult = await this.reverseMapbox(latNum, lngNum);
        if (mapboxResult) return mapboxResult;
      } catch (error: any) {
        this.logger.warn(`Mapbox failed: ${error.message}`);
      }
    }

    return this.reverseNominatim(lat, lng);
  }

  private async reverseMapbox(lat: number, lng: number) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.MAPBOX_TOKEN}&language=th&types=address,place,locality,neighborhood&limit=1`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'th' } });
    if (!response.ok) throw new Error('Mapbox request failed');
    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const feature = data.features[0];
    const address: Record<string, string> = {};
    const context = feature.context || [];

    for (const ctx of context) {
      const id = ctx.id || '';
      const text = ctx.text || '';
      if (id.startsWith('neighborhood.')) {
        address.suburb = text;
      } else if (id.startsWith('locality.')) {
        address.city = text;
      } else if (id.startsWith('place.')) {
        address.county = text;
      } else if (id.startsWith('district.')) {
        address.city_district = text;
      } else if (id.startsWith('region.')) {
        address.state = text;
      } else if (id.startsWith('postcode.')) {
        address.postcode = text;
      } else if (id.startsWith('country.')) {
        address.country = text;
        if (ctx.short_code) address.country_code = ctx.short_code;
      } else if (id.startsWith('address.')) {
        const parts = text.split(' ');
        if (parts.length > 1) {
          address.house_number = parts[0];
          address.road = parts.slice(1).join(' ');
        } else {
          address.road = text;
        }
      }
    }

    const placeText = feature.text || '';
    const placeName = feature.place_name || '';
    if (!address.house_number && !address.road && placeText) {
      const match = placeText.match(/^(\d+\s*[\/\-]?\d*)\s+(.+)$/);
      if (match) {
        address.house_number = match[1].trim();
        address.road = match[2].trim();
      } else if (/^\d/.test(placeText)) {
        address.house_number = placeText;
      } else {
        address.road = placeText;
      }
    }

    return {
      place_id: feature.id,
      display_name: placeName,
      lat: lat.toString(),
      lon: lng.toString(),
      address,
      name: feature.text || '',
    };
  }

  private async reverseNominatim(lat: string, lng: string) {
    for (let i = 0; i < this.RETRIES; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent':
                'VolunteerSmartApp/1.0 (contact@volunteersmart.com)',
              'Accept-Language': 'th',
              Referer: 'https://volunteersmart.com',
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('ไม่สามารถค้นหาพิกัดได้ กรุณาลองใหม่');
        }

        return await response.json();
      } catch (error: any) {
        this.logger.warn(`Nominatim attempt ${i + 1} failed: ${error.message}`);

        if (i === this.RETRIES - 1) {
          this.logger.error('All geocode attempts failed', error.stack);
          return { error: 'ไม่สามารถดึงข้อมูลที่อยู่ได้ กรุณาลองใหม่อีกครั้ง' };
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, i)),
        );
      }
    }
  }
}
