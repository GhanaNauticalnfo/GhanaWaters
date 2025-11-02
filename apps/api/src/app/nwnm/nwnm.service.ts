import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NwNmMessagePart {
  geometry?: any;
}

export interface NwNmMessage {
  id: number | string;
  mainType: 'NW' | 'NM';
  parts?: NwNmMessagePart[];
}

@Injectable()
export class NwnmService {
  private readonly niordApiUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Get Niord API URL from environment or use default
    this.niordApiUrl = this.configService.get<string>(
      'NIORD_API_URL',
      'https://niord.ghananautical.info/rest'
    );
  }

  async getMessages(lang = 'en'): Promise<NwNmMessage[]> {
    try {
      // Build URL with multiple mainType parameters (Niord expects Set<String>)
      const params = new URLSearchParams({ lang });
      params.append('mainType', 'NW');
      params.append('mainType', 'NM');

      const url = `${this.niordApiUrl}/public/v1/messages?${params.toString()}`;

      console.log('Fetching from Niord API:', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GhanaWaters-API/1.0',
        },
      });

      console.log('Niord API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Niord API error:', response.status, response.statusText, errorBody);
        return [];
      }

      const data = await response.json();
      console.log('Niord API returned', Array.isArray(data) ? data.length : 0, 'messages');

      // Transform Niord response to our format
      return this.transformNiordMessages(data);
    } catch (error) {
      console.error('Error fetching from Niord API:', error);
      // Return empty array instead of throwing to prevent frontend errors
      return [];
    }
  }

  private transformNiordMessages(niordMessages: any): NwNmMessage[] {
    if (!Array.isArray(niordMessages)) {
      return [];
    }

    return niordMessages.map(msg => {
      const parts: NwNmMessagePart[] = [];

      // Extract geometry from message parts if available
      if (msg.parts && Array.isArray(msg.parts)) {
        msg.parts.forEach((part: any) => {
          if (part.geometry) {
            parts.push({
              geometry: part.geometry
            });
          }
        });
      }

      return {
        id: msg.id || msg.shortId || '',
        mainType: msg.mainType || 'NW',
        parts: parts.length > 0 ? parts : undefined,
      };
    });
  }
}
