﻿using Application.Common.CQS.Queries;
using Application.Common.Extensions;
using AutoMapper;
using Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.PurchaseReturnManager.Queries;


public class GetPurchaseReturnSingleProfile : Profile
{
    public GetPurchaseReturnSingleProfile()
    {
    }
}

public class GetPurchaseReturnSingleResult
{
    public PurchaseReturn? Data { get; init; }
    public List<InventoryTransaction>? TransactionList { get; init; }
    public double? BeforeTaxAmount { get; init; }
    public double? TaxAmount { get; init; }
    public double? AfterTaxAmount { get; init; }
}

public class GetPurchaseReturnSingleRequest : IRequest<GetPurchaseReturnSingleResult>
{
    public string? Id { get; init; }

}

public class GetPurchaseReturnSingleValidator : AbstractValidator<GetPurchaseReturnSingleRequest>
{
    public GetPurchaseReturnSingleValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

public class GetPurchaseReturnSingleHandler : IRequestHandler<GetPurchaseReturnSingleRequest, GetPurchaseReturnSingleResult>
{
    private readonly IQueryContext _context;

    public GetPurchaseReturnSingleHandler(
        IQueryContext context
        )
    {
        _context = context;
    }

    public async Task<GetPurchaseReturnSingleResult> Handle(GetPurchaseReturnSingleRequest request, CancellationToken cancellationToken)
    {
        var queryData = _context
            .SetWithTenantFilter<PurchaseReturn>()
            .AsNoTracking()
            .Include(x => x.GoodsReceive)
                .ThenInclude(x => x.PurchaseOrder)
                    .ThenInclude(x => x.Vendor)
            .Include(x => x.GoodsReceive)
                .ThenInclude(x => x.PurchaseOrder)
                    .ThenInclude(x => x.Tax)
            .Where(x => x.Id == request.Id)
            .AsQueryable();

        var data = await queryData.SingleOrDefaultAsync(cancellationToken);


        var queryTransactionList = _context
            .SetWithTenantFilter<InventoryTransaction>()
            .AsNoTracking()
            .IsDeletedEqualTo(false)
            .Include(x => x.Product)
            .Include(x => x.Warehouse)
            .Include(x => x.WarehouseFrom)
            .Include(x => x.WarehouseTo)
            .Where(x => x.ModuleId == request.Id && x.ModuleName == nameof(PurchaseReturn))
            .AsQueryable();

        var transactionList = await queryTransactionList.ToListAsync(cancellationToken);

        var beforeTaxAmount = transactionList.Sum(x => x.Product?.UnitPrice * x.Movement);
        var taxAmount = data?.GoodsReceive?.PurchaseOrder?.Tax?.Percentage * beforeTaxAmount / 100;
        var afterTaxAmount = beforeTaxAmount + taxAmount;

        return new GetPurchaseReturnSingleResult
        {
            Data = data,
            TransactionList = transactionList,
            BeforeTaxAmount = beforeTaxAmount,
            TaxAmount = taxAmount,
            AfterTaxAmount = afterTaxAmount
        };
    }
}