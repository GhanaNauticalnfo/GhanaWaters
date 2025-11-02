// kml-dataset.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
import { KmlDatasetService } from './kml-dataset.service';
import { KmlDataset } from './kml-dataset.entity';
import { KmlDatasetInputDto, KmlDatasetResponseDto } from './dto';
import { Public } from '../auth/decorators';

@ApiTags('kml-datasets')
@Controller('kml-datasets')
export class KmlDatasetController {
  constructor(private readonly kmlDatasetService: KmlDatasetService) {}

  @Get()
  @Public() // Public access for frontend map to display enabled KML datasets
  @ApiResponse({ type: [KmlDatasetResponseDto] })
  async findAll(): Promise<KmlDatasetResponseDto[]> {
    const datasets = await this.kmlDatasetService.findAll();
    return datasets.map(dataset => dataset.toResponseDto());
  }

  @Get(':id')
  @ApiResponse({ type: KmlDatasetResponseDto })
  async findOne(@Param('id') id: string): Promise<KmlDatasetResponseDto> {
    const dataset = await this.kmlDatasetService.findOne(+id);
    
    if (!dataset) {
      throw new HttpException('KML dataset not found', HttpStatus.NOT_FOUND);
    }
    
    return dataset.toResponseDto();
  }

  @Get('enabled')
  async findAllEnabled(): Promise<{ id: number; last_updated: Date }[]> {
    try {
      return await this.kmlDatasetService.findAllEnabled();
    } catch {
      throw new HttpException('Error fetching enabled KML datasets', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
@Post()
@ApiBody({ type: KmlDatasetInputDto })
@ApiResponse({ type: KmlDatasetResponseDto })
async create(@Body() createDto: KmlDatasetInputDto): Promise<KmlDatasetResponseDto> {
  try {
    const dataset = await this.kmlDatasetService.create(createDto.kml, createDto.name, createDto.enabled);
    return dataset.toResponseDto();
  } catch {
    throw new HttpException('Error creating KML dataset', HttpStatus.BAD_REQUEST);
  }
}

@Put(':id')
@ApiBody({ type: KmlDatasetInputDto })
@ApiResponse({ type: KmlDatasetResponseDto })
async update(@Param('id') id: string, @Body() updateDto: KmlDatasetInputDto): Promise<KmlDatasetResponseDto> {
  try {
    const dataset = await this.kmlDatasetService.update(+id, updateDto);
    return dataset.toResponseDto();
  } catch {
    throw new HttpException('Error updating KML dataset', HttpStatus.BAD_REQUEST);
  }
}

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    const dataset = await this.kmlDatasetService.findOne(+id);
    
    if (!dataset) {
      throw new HttpException('KML dataset not found', HttpStatus.NOT_FOUND);
    }
    
    await this.kmlDatasetService.remove(+id);
  }
}