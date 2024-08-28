import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ReservationRepository } from 'src/repositories/reservation.repository';
import { MercadoPagoService } from 'src/services/mercadoPago.service';

@Controller('mercado-pago')
export class MercadoPagoController {
  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly reservationRepository: ReservationRepository,
  ) {}

  @Post()
  createPreference(@Body() body: any): Promise<any> {
    return this.mercadoPagoService.createPreference(body);
  }

  @Get('success/:id')
  async success(@Res() res, @Param('id', ParseUUIDPipe) id: string) {
    console.log('success');
    const reservation = await this.reservationRepository.changestatusToPaid(id);
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }
    // res.redirect('https://front-hotel-app-g8u2.vercel.app/payOk');
  }

  @Get('failure')
  failure(@Res() res) {
    console.log('failure');
    // res.redirect('https://front-hotel-app-g8u2.vercel.app/payWrong');
  }
}
