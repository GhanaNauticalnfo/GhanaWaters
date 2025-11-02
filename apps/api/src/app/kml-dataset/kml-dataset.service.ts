// kml-dataset.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DOMParser } from '@xmldom/xmldom';
import { KmlDataset } from './kml-dataset.entity';
import { KmlDatasetInputDto } from './dto';

@Injectable()
export class KmlDatasetService {
  constructor(
    @InjectRepository(KmlDataset)
    private kmlDatasetRepository: Repository<KmlDataset>,
  ) {}

  async findAll(): Promise<KmlDataset[]> {
    return this.kmlDatasetRepository.find();
  }

  async findOne(id: number): Promise<KmlDataset> {
    return this.kmlDatasetRepository.findOne({ where: { id } });
  }

  // kml-dataset.service.ts - add this new method
async findAllEnabled(): Promise<{ id: number; last_updated: Date }[]> {
    const datasets = await this.kmlDatasetRepository.find({
      select: {
        id: true,
        last_updated: true
      },
      where: {
        enabled: true
      },
      order: {
        last_updated: 'DESC'
      }
    });

    return datasets;
  }

  private validateKml(kmlContent: string): void {
    // Check for empty content
    if (!kmlContent || kmlContent.trim() === '') {
      throw new BadRequestException('KML content cannot be empty');
    }

    try {
      // Parse XML using DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(kmlContent, 'text/xml');

      // Check for parser errors
      const parserError = doc.getElementsByTagName('parsererror')[0];
      if (parserError) {
        const errorText = parserError.textContent || 'Unknown parsing error';
        throw new BadRequestException(`Invalid XML format: ${errorText}`);
      }

      // Verify it's actually KML (has a <kml> root element)
      const kmlElement = doc.getElementsByTagName('kml')[0];
      if (!kmlElement) {
        throw new BadRequestException('Not valid KML: missing <kml> root element');
      }
    } catch (error) {
      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Wrap other errors
      throw new BadRequestException(`KML validation failed: ${error.message}`);
    }
  }

async create(kmlData: string, name: string, enabled = true): Promise<KmlDataset> {
    // Validate KML before creating
    this.validateKml(kmlData);

    const kmlDataset = new KmlDataset();
    kmlDataset.kml = kmlData;
    kmlDataset.name = name;
    kmlDataset.enabled = enabled;
    
    return this.kmlDatasetRepository.save(kmlDataset);
  }
  
  async update(id: number, data: KmlDatasetInputDto): Promise<KmlDataset> {
    const kmlDataset = await this.findOne(id);

    if (!kmlDataset) {
      throw new Error('KML dataset not found');
    }

    // Validate KML if it's being updated
    if (data.kml !== undefined) {
      this.validateKml(data.kml);
      kmlDataset.kml = data.kml;
    }
    
    if (data.name !== undefined) {
      kmlDataset.name = data.name;
    }
    
    if (data.enabled !== undefined) {
      kmlDataset.enabled = data.enabled;
    }
    
    return this.kmlDatasetRepository.save(kmlDataset);
  }

  async remove(id: number): Promise<void> {
    await this.kmlDatasetRepository.delete(id);
  }
}