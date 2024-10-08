import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateReservationDto,
  GetReservationsFiltersDto,
} from 'src/dtos/reservation.dtos';
import { GuestPrice } from 'src/entities/guestPrice.entity';
import { MonthlyProfit } from 'src/entities/monthlyProfit.entity';
import { Reservation } from 'src/entities/reservation.entity';
import { Room } from 'src/entities/room.entity';
import { ReservationService } from 'src/entities/s-r.entity';
import { Service } from 'src/entities/service.entity';
import { User } from 'src/entities/user.entity';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

@Injectable()
export class ReservationRepository {
  constructor(
    @InjectRepository(Reservation)
    readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(MonthlyProfit)
    private readonly monthlyProfitRepository: Repository<MonthlyProfit>,
    @InjectRepository(ReservationService)
    private readonly reservationServiceRepository: Repository<ReservationService>,
    @InjectRepository(GuestPrice)
    private readonly guestPriceRepository: Repository<GuestPrice>,
  ) {}

  async getReservations(id: string, body?: GetReservationsFiltersDto) {
    const hasStartDate = body?.startDay || body?.startMonth || body?.startYear;
    const hasEndDate = body?.endDay || body?.endMonth || body?.endYear;

    if (hasStartDate || hasEndDate) {
      const missingStartDateParts =
        (body.startDay && (!body.startMonth || !body.startYear)) ||
        (body.startMonth && (!body.startDay || !body.startYear)) ||
        (body.startYear && (!body.startDay || !body.startMonth));

      const missingEndDateParts =
        (body.endDay && (!body.endMonth || !body.endYear)) ||
        (body.endMonth && (!body.endDay || !body.endYear)) ||
        (body.endYear && (!body.endDay || !body.endMonth));

      if (missingStartDateParts || missingEndDateParts) {
        throw new ConflictException('Incomplete date information provided.');
      }

      const startDate = new Date(
        body.startYear,
        body.startMonth - 1,
        body.startDay,
      );
      const endDate = new Date(body.endYear, body.endMonth - 1, body.endDay);

      if (startDate > endDate) {
        throw new ConflictException(
          'Start date cannot be later than end date.',
        );
      }

      const reservations = await this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.user = :id', { id })
        .andWhere(
          'reservation.startDate <= :endDate AND reservation.endDate >= :startDate',
          { startDate, endDate },
        )
        .getMany();

      return reservations;
    }

    if (!body) {
      const reservations = await this.reservationRepository.find({
        where: { user: { id } },
      });
      return reservations;
    } else if (body.status && !hasStartDate && !hasEndDate) {
      const reservations = await this.reservationRepository.find({
        where: { user: { id }, status: body.status },
      });
      return reservations;
    }
  }

  async getAllReservations(body?: GetReservationsFiltersDto) {
    const hasStartDate = body?.startDay || body?.startMonth || body?.startYear;
    const hasEndDate = body?.endDay || body?.endMonth || body?.endYear;

    if (hasStartDate || hasEndDate) {
      const missingStartDateParts =
        (body.startDay && (!body.startMonth || !body.startYear)) ||
        (body.startMonth && (!body.startDay || !body.startYear)) ||
        (body.startYear && (!body.startDay || !body.startMonth));

      const missingEndDateParts =
        (body.endDay && (!body.endMonth || !body.endYear)) ||
        (body.endMonth && (!body.endDay || !body.endYear)) ||
        (body.endYear && (!body.endDay || !body.endMonth));

      if (missingStartDateParts || missingEndDateParts) {
        throw new ConflictException('Incomplete date information provided.');
      }

      const startDate = new Date(
        body.startYear,
        body.startMonth - 1,
        body.startDay,
      );
      const endDate = new Date(body.endYear, body.endMonth - 1, body.endDay);

      if (startDate > endDate) {
        throw new ConflictException(
          'Start date cannot be later than end date.',
        );
      }

      const reservations = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.user', 'user')
        .leftJoinAndSelect('reservation.room', 'room')
        .where(
          'reservation.startDate <= :endDate AND reservation.endDate >= :startDate',
          { startDate, endDate },
        )
        .getMany();

      return reservations;
    }

    if (!body) {
      const reservations = await this.reservationRepository.find({
        relations: ['user', 'room'],
      });
      return reservations;
    } else if (body.status) {
      const reservations = await this.reservationRepository.find({
        where: { status: body.status },
        relations: ['user', 'room'],
      });
      return reservations;
    }
  }

  async getReservationsRoom(id: string, body?: GetReservationsFiltersDto) {
    const hasStartDate = body?.startDay || body?.startMonth || body?.startYear;
    const hasEndDate = body?.endDay || body?.endMonth || body?.endYear;

    if (hasStartDate && hasEndDate) {
      const missingStartDateParts =
        (body.startDay && (!body.startMonth || !body.startYear)) ||
        (body.startMonth && (!body.startDay || !body.startYear)) ||
        (body.startYear && (!body.startDay || !body.startMonth));

      const missingEndDateParts =
        (body.endDay && (!body.endMonth || !body.endYear)) ||
        (body.endMonth && (!body.endDay || !body.endYear)) ||
        (body.endYear && (!body.endDay || !body.endMonth));

      if (missingStartDateParts || missingEndDateParts) {
        throw new ConflictException('Incomplete date information provided.');
      }
    }

    const query = this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.room', 'room')
      .where('reservation.room.id = :id', { id });

    if (hasStartDate && hasEndDate) {
      const startDate = new Date(
        body.startYear,
        body.startMonth - 1,
        body.startDay,
      );
      const endDate = new Date(body.endYear, body.endMonth - 1, body.endDay);

      query.andWhere(
        'reservation.startDate <= :endDate AND reservation.endDate >= :startDate',
        { startDate, endDate },
      );
    }

    const reservations = await query.getMany();

    return reservations;
  }

  async checkin(id: string, body: CreateReservationDto) {
    const currentYear = new Date().getFullYear();

    const isInvalidDate =
      body.startYear < currentYear ||
      body.endYear < currentYear ||
      body.startMonth < 1 ||
      body.startMonth > 12 ||
      body.endMonth < 1 ||
      body.endMonth > 12 ||
      body.startDay < 1 ||
      body.startDay > 31 ||
      body.endDay < 1 ||
      body.endDay > 31 ||
      new Date(body.startYear, body.startMonth - 1, body.startDay).getTime() >
        new Date(body.endYear, body.endMonth - 1, body.endDay).getTime();

    if (isInvalidDate) {
      throw new ConflictException('Invalid date');
    }

    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const room = await this.roomRepository.findOne({
      where: { id: body.roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const startDate = new Date(
      body.startYear,
      body.startMonth - 1,
      body.startDay,
    );
    const endDate = new Date(body.endYear, body.endMonth - 1, body.endDay);

    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (days <= 0) {
      throw new ConflictException('Invalid date range');
    } else if (days > 15) {
      throw new ConflictException('Maximum 15 days');
    }

    const actuallyActiveReservation = await this.reservationRepository.findOne({
      where: { user: user, status: 'active' },
    });

    if (actuallyActiveReservation) {
      throw new ConflictException('You already have an active reservation');
    }

    const overlappingReservation = await this.reservationRepository.findOne({
      where: [
        {
          room: { id: body.roomId },
          startDate: LessThanOrEqual(endDate),
          endDate: MoreThanOrEqual(startDate),
        },
      ],
    });

    if (overlappingReservation) {
      throw new ConflictException(
        'There is already a reservation during these dates for this room.',
      );
    }

    let totalPrice: number = room.price * days;

    let guestCount: number = 0;

    for (const guest of [body.guestName1, body.guestName2, body.guestName3]) {
      if (guest) {
        guestCount++;
      }
    }

    const guestPrice = await this.guestPriceRepository.findOne({
      where: { name: 'guest' },
    });

    if (!guestPrice) {
      throw new NotFoundException('Guest price not found');
    }

    guestCount *= guestPrice.price;
    totalPrice += guestCount;

    // Crear la reserva
    const reservation = this.reservationRepository.create({
      price: totalPrice,
      startDate,
      endDate,
      guestName1: body.guestName1,
      guestLastName1: body.guestLastName1,
      guestName2: body.guestName2,
      guestLastName2: body.guestLastName2,
      guestName3: body.guestName3,
      guestLastName3: body.guestLastName3,
      user,
      room,
    });
    await this.reservationRepository.save(reservation);

    for (const serviceType of body.services) {
      const serviceEntity = await this.serviceRepository.findOne({
        where: { type: serviceType },
      });

      if (!serviceEntity) {
        throw new NotFoundException(`Service of type ${serviceType} not found`);
      }

      totalPrice += serviceEntity.price;

      const reservationService = this.reservationServiceRepository.create({
        reservation,
        service: serviceEntity,
        price: serviceEntity.price,
      });

      await this.reservationServiceRepository.save(reservationService);
    }

    const monthlyProfit = await this.monthlyProfitRepository.findOne({
      where: { year: body.startYear, month: body.startMonth },
    });

    if (!monthlyProfit) {
      await this.monthlyProfitRepository.save({
        year: body.startYear,
        month: body.startMonth,
        profit: totalPrice,
      });
    } else {
      monthlyProfit.profit += totalPrice;
      await this.monthlyProfitRepository.save(monthlyProfit);
    }
    reservation.price = totalPrice;
    await this.reservationRepository.save(reservation);

    return reservation;
  }

  async checkout(id: string) {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status === 'finished') {
      throw new ConflictException('Reservation already finished');
    }

    reservation.status = 'finished';
    await this.reservationRepository.save(reservation);

    return reservation;
  }
}
