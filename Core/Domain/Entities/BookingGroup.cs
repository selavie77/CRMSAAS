﻿using Domain.Common;

namespace Domain.Entities;

public class BookingGroup : BaseEntity, IHasTenantId
{
    public string? TenantId { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
}