import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './auth/decorators';

@ApiExcludeController()
@Controller()
@Public() // Root redirects should be public
export class RootController {
  @Get()
  @Redirect('/api', 301)
  redirectToApi() {
    // This method redirects root path to /api
  }
}