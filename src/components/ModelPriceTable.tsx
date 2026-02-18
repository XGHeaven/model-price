import { Fragment, useEffect, useState } from 'react';
import type { Model, ModelsData, PriceTier } from '@/types/model';
import { Currency } from '@/types/model';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ProviderInfo {
  id: string;
  name: string;
  pricingUrl: string;
  region: string;
  description: string;
}

export function ModelPriceTable() {
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(Currency.CNY);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortKey, setSortKey] = useState('name');
  const [groupByProvider, setGroupByProvider] = useState(false);

  const exchangeRate = 7.2; // 1 USD = 7.2 CNY

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modelsResponse, providersResponse] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}models.json`),
          fetch(`${import.meta.env.BASE_URL}providers.json`),
        ]);
        
        if (!modelsResponse.ok || !providersResponse.ok) {
          throw new Error('加载数据失败');
        }
        
        const modelsData: ModelsData = await modelsResponse.json();
        const providersData: ProviderInfo[] = await providersResponse.json();
        
        setModels(modelsData.models);
        setProviders(providersData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载过程中发生错误');
        setModels([]);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-500">正在加载模型...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-red-500">加载失败：{error}</div>
      </div>
    );
  }

  const providerColors: Record<string, string> = {
    openai: 'bg-green-100 text-green-800',
    anthropic: 'bg-blue-100 text-blue-800',
    google: 'bg-yellow-100 text-yellow-800',
    meta: 'bg-purple-100 text-purple-800',
  };

  const getProviderName = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || providerId;
  };

  const providerIds = Array.from(new Set(models.map((model) => model.provider))).sort();

  const resolveTiers = (model: Model): PriceTier[] => {
    if (model.pricingTiers && model.pricingTiers.length > 0) {
      return model.pricingTiers;
    }
    return [
      {
        label: '统一定价',
        inputPrice: model.inputPrice ?? 0,
        outputPrice: model.outputPrice ?? 0,
        cachedInputPrice: model.cachedInputPrice,
        cachedOutputPrice: model.cachedOutputPrice,
      },
    ];
  };

  const getTierMin = (model: Model, key: 'input' | 'output') => {
    return Math.min(
      ...resolveTiers(model).map((tier) =>
        key === 'input' ? tier.inputPrice : tier.outputPrice
      )
    );
  };

  const convertPrice = (price: number, billingCurrency: Currency) => {
    if (billingCurrency === displayCurrency) {
      return price;
    }
    return billingCurrency === Currency.USD ? price * exchangeRate : price / exchangeRate;
  };

  const formatPrice = (price: number) => {
    const symbol = displayCurrency === Currency.USD ? '$' : '￥';
    return `${symbol}${price.toFixed(2)}`;
  };

  const formatOptionalPrice = (price: number | undefined, billingCurrency: Currency) => {
    if (price === undefined) {
      return '—';
    }
    return formatPrice(convertPrice(price, billingCurrency));
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      model.name.toLowerCase().includes(normalizedSearch) ||
      model.provider.toLowerCase().includes(normalizedSearch);
    const matchesProvider =
      providerFilter === 'all' || model.provider === providerFilter;
    return matchesSearch && matchesProvider;
  });

  const sortedModels = [...filteredModels].sort((a, b) => {
    switch (sortKey) {
      case 'name':
        return a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name);
      case 'input-desc':
        return (
          convertPrice(getTierMin(b, 'input'), b.billingCurrency) -
          convertPrice(getTierMin(a, 'input'), a.billingCurrency)
        );
      case 'output-asc':
        return (
          convertPrice(getTierMin(a, 'output'), a.billingCurrency) -
          convertPrice(getTierMin(b, 'output'), b.billingCurrency)
        );
      case 'output-desc':
        return (
          convertPrice(getTierMin(b, 'output'), b.billingCurrency) -
          convertPrice(getTierMin(a, 'output'), a.billingCurrency)
        );
      case 'input-asc':
      default:
        return (
          convertPrice(getTierMin(a, 'input'), a.billingCurrency) -
          convertPrice(getTierMin(b, 'input'), b.billingCurrency)
        );
    }
  });

  const groupedModels = sortedModels.reduce<Record<string, Model[]>>((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {});

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索模型或供应商"
          className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none sm:w-64"
        />
        <select
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value)}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none"
        >
          <option value="all">全部供应商</option>
          {providerIds.map((providerId) => (
            <option key={providerId} value={providerId}>
              {getProviderName(providerId)}
            </option>
          ))}
        </select>
        <select
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value)}
          className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none"
        >
          <option value="name">供应商和名称</option>
          <option value="input-asc">输入价格：从低到高</option>
          <option value="input-desc">输入价格：从高到低</option>
          <option value="output-asc">输出价格：从低到高</option>
          <option value="output-desc">输出价格：从高到低</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={groupByProvider}
            onChange={(event) => setGroupByProvider(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-gray-900"
          />
          按供应商分组
        </label>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span>显示币种</span>
          <div className="inline-flex rounded-md border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setDisplayCurrency(Currency.USD)}
              className={`rounded px-3 py-1 text-sm ${
                displayCurrency === Currency.USD
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700'
              }`}
            >
              USD
            </button>
            <button
              type="button"
              onClick={() => setDisplayCurrency(Currency.CNY)}
              className={`rounded px-3 py-1 text-sm ${
                displayCurrency === Currency.CNY
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700'
              }`}
            >
              CNY
            </button>
          </div>
          <span className="text-xs text-gray-400">汇率 1 USD = {exchangeRate} CNY</span>
        </div>
      </div>
      <Table>
        <TableCaption>大模型价格与汇率换算</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">模型</TableHead>
            <TableHead className="font-semibold">供应商</TableHead>
            <TableHead className="font-semibold">结算币种</TableHead>
            <TableHead className="font-semibold">
              <div>上下文</div>
              <div className="text-xs font-normal text-gray-500">1K tokens</div>
            </TableHead>
            <TableHead className="text-right font-semibold">
              <div>输入单价</div>
              <div className="text-xs font-normal text-gray-500">1M tokens</div>
            </TableHead>
            <TableHead className="text-right font-semibold">
              <div>输出单价</div>
              <div className="text-xs font-normal text-gray-500">1M tokens</div>
            </TableHead>
            <TableHead className="text-right font-semibold">
              <div>缓存输入</div>
              <div className="text-xs font-normal text-gray-500">1M tokens</div>
            </TableHead>
            <TableHead className="text-right font-semibold">
              <div>缓存输出</div>
              <div className="text-xs font-normal text-gray-500">1M tokens</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedModels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-gray-500">
                没有符合当前筛选条件的模型。
              </TableCell>
            </TableRow>
          ) : groupByProvider ? (
            Object.entries(groupedModels).map(([provider, providerModels]) => (
              <Fragment key={provider}>
                <TableRow>
                  <TableCell colSpan={8} className="bg-gray-50 text-sm font-semibold text-gray-700">
                    {getProviderName(provider)}
                  </TableCell>
                </TableRow>
                {providerModels.map((model) =>
                  resolveTiers(model).map((tier, tierIndex) => (
                    <TableRow key={`${model.id}-${tier.label}`}>
                      <TableCell className="font-medium">
                        {tierIndex === 0 ? model.name : ''}
                      </TableCell>
                      <TableCell>
                        {tierIndex === 0 ? (
                          <Badge
                            className={providerColors[model.provider] || 'bg-gray-100 text-gray-800'}
                          >
                            {getProviderName(model.provider)}
                          </Badge>
                        ) : (
                          ''
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {tierIndex === 0 ? model.billingCurrency : ''}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{tier.label}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(convertPrice(tier.inputPrice, model.billingCurrency))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(convertPrice(tier.outputPrice, model.billingCurrency))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatOptionalPrice(tier.cachedInputPrice, model.billingCurrency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatOptionalPrice(tier.cachedOutputPrice, model.billingCurrency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </Fragment>
            ))
          ) : (
            sortedModels.flatMap((model) =>
              resolveTiers(model).map((tier, tierIndex) => (
                <TableRow key={`${model.id}-${tier.label}`}>
                  <TableCell className="font-medium">
                    {tierIndex === 0 ? model.name : ''}
                  </TableCell>
                  <TableCell>
                    {tierIndex === 0 ? (
                      <Badge
                        className={providerColors[model.provider] || 'bg-gray-100 text-gray-800'}
                      >
                        {getProviderName(model.provider)}
                      </Badge>
                    ) : (
                      ''
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {tierIndex === 0 ? model.billingCurrency : ''}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{tier.label}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(convertPrice(tier.inputPrice, model.billingCurrency))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(convertPrice(tier.outputPrice, model.billingCurrency))}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatOptionalPrice(tier.cachedInputPrice, model.billingCurrency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatOptionalPrice(tier.cachedOutputPrice, model.billingCurrency)}
                  </TableCell>
                </TableRow>
              ))
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
}
